import { useState, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const useReceiptProcessing = (updateCategoryTotal, onBudgetRefresh = null) => {
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
      // Step 1: OCR Processing
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(selectedFile);
      await worker.terminate();

      setOcrText(text);

      // Step 2: AI Analysis
      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `From the following receipt text, extract the store name and the final total. Classify the store into one of the following categories: "Clothing", "Food and Drink", "Utilities", "Entertainment", or "Other". Please return ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting. If you cannot find a value for a field, use null. The JSON object must have these keys: "storeName", "total", "category".\n\nReceipt Text:\n${text}`
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

      // Step 3: Update Database
      if (jsonData.category && jsonData.total) {
        const amount = parseFloat(String(jsonData.total).replace(/[^0-9.-]+/g, ""));
        
        if (isNaN(amount)) {
          throw new Error(`Invalid total amount received from AI: ${jsonData.total}`);
        }

        const categoryName = jsonData.category.replace(/^"|"$/g, '').trim();
        await updateCategoryTotal(categoryName, amount);
        
        // Refresh budgets if callback is provided
        if (onBudgetRefresh) {
          await onBudgetRefresh();
        }
      } else {
        throw new Error("AI response did not include a 'category' and a 'total'.");
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