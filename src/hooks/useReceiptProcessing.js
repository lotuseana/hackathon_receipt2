import { useState, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleCloudVisionService } from '../services/googleCloudVision';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Check if API key is available
const googleCloudVisionApiKey = process.env.REACT_APP_GOOGLE_CLOUD_VISION_API_KEY;
// console.log('Google Cloud Vision API Key available:', !!googleCloudVisionApiKey);
// if (googleCloudVisionApiKey) {
//   console.log('API Key (first 10 chars):', googleCloudVisionApiKey.substring(0, 10) + '...');
// }

// Initialize Google Cloud Vision service
const googleCloudVision = new GoogleCloudVisionService(googleCloudVisionApiKey);

export const useReceiptProcessing = (addSpendingItem, onBudgetRefresh = null, categories = []) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrText, setOcrText] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Clean up the object URL when the component unmounts or the file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
  };

  const handleCapture = (file) => {
    setSelectedFile(file);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
  };

  const processReceipt = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setOcrText(null);
    setStructuredData(null);
    setError(null);
    
    try {
      // Step 1: OCR Processing using Google Cloud Vision API
      const text = await googleCloudVision.extractTextFromImage(selectedFile);
      setOcrText(text);

      // Log the extracted text to the console
      console.log("--- Extracted OCR Text ---");
      console.log(text);
      console.log("--------------------------");
      
      const categoryNames = categories.map(c => c.name).join('", "');

      // Step 2: AI Analysis for itemization
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 2048, // Increased tokens for longer receipts
        messages: [{
          role: "user",
          content: `From the following receipt text, extract the store name, the final total, and a list of all items. For each item, provide its description, price, and classify it into one of the available categories.

Please return ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting.

The JSON object must have these keys: "storeName", "total", "items".
The "items" key must hold an array of objects, where each object has "description", "price", and "category" keys.
- The "description" should be a short, clean name for the item.
- The "price" must be a number (e.g., 12.99).
- The "category" must be one of the provided category names.
- Explicitly look for a "Tax" or "Sales Tax" line item and classify it under the "Tax" category.

If a value cannot be found, use null. For item categorization, use "Other" if no other category fits.

Available Categories:
"${categoryNames}"

Receipt Text:
${text}`
        }],
      });
      
      let responseText = msg.content[0].text;
      let jsonData;

      try {
        jsonData = JSON.parse(responseText);
      } catch (parseError) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            jsonData = JSON.parse(jsonMatch[0]);
          } catch (nestedParseError) {
             throw new Error("Could not parse the structured data from the AI's response.");
          }
        } else {
          throw new Error("The AI's response was not in the expected format.");
        }
      }
      setStructuredData(jsonData);

      // Step 3: Update Database with itemized spending
      if (jsonData.items && Array.isArray(jsonData.items)) {
        for (const item of jsonData.items) {
          if (item.category && item.price) {
            const amount = parseFloat(String(item.price).replace(/[^0-9.-]+/g, ""));
            
            if (isNaN(amount)) {
              console.warn(`Invalid amount for item "${item.description}": ${item.price}`);
              continue; // Skip invalid items
            }

            const categoryName = item.category.replace(/^"|"$/g, '').trim();
            await addSpendingItem({
              categoryName,
              amount,
              itemName: item.description || 'Scanned Item'
            });
          }
        }
        
        // Refresh budgets if callback is provided
        if (onBudgetRefresh) {
          await onBudgetRefresh();
        }
      } else {
        throw new Error("AI response did not include a valid 'items' array.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    selectedFile,
    previewUrl,
    ocrText,
    structuredData,
    isExtracting,
    error,
    handleFileSelect,
    handleCapture,
    handleCancel,
    processReceipt,
    setError
  };
}; 