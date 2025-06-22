// Google Cloud Vision API service for OCR processing
// Note: You'll need to install @google-cloud/vision package: npm install @google-cloud/vision

export class GoogleCloudVisionService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://vision.googleapis.com/v1/images:annotate';
  }

  async extractTextFromImage(imageFile) {
    try {
      // Validate API key
      if (!this.apiKey || this.apiKey === 'your_google_cloud_vision_api_key_here') {
        throw new Error('Google Cloud Vision API key is not configured. Please set REACT_APP_GOOGLE_CLOUD_VISION_API_KEY in your .env file.');
      }

      // Convert image file to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Validate base64 image
      if (!base64Image || !base64Image.startsWith('data:')) {
        throw new Error('Failed to convert image to base64 format');
      }

      // Extract the base64 content (remove data:image/jpeg;base64, prefix)
      const base64Content = base64Image.split(',')[1];
      if (!base64Content) {
        throw new Error('Invalid base64 image format');
      }

      // Prepare the request payload
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Content
            },
            features: [
              {
                type: 'DOCUMENT_TEXT_DETECTION',
                maxResults: 1
              }
            ]
          }
        ]
      };

      // Make the API request
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        let errorMessage = `Google Cloud Vision API error: ${response.status} ${response.statusText}`;
        
        // Try to parse error details
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error && errorJson.error.message) {
            errorMessage += ` - ${errorJson.error.message}`;
          }
        } catch (parseError) {
          // If we can't parse the error, just use the raw text
          errorMessage += ` - ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      const responseData = result.responses[0];
      if (responseData.error) {
        // Handle API-specific errors
        throw new Error(`Google Cloud Vision API error: ${responseData.error.message}`);
      }
      
      // Reconstruct text from structured data to preserve formatting
      if (responseData.fullTextAnnotation) {
        let reconstructedText = '';
        responseData.fullTextAnnotation.pages.forEach(page => {
          page.blocks.forEach(block => {
            block.paragraphs.forEach(paragraph => {
              paragraph.words.forEach(word => {
                word.symbols.forEach(symbol => {
                  reconstructedText += symbol.text;
                  const breakType = symbol.property?.detectedBreak?.type;
                  if (breakType === 'SPACE' || breakType === 'SURE_SPACE') {
                    reconstructedText += ' ';
                  } else if (breakType === 'EOL_SURE_SPACE' || breakType === 'LINE_BREAK') {
                    reconstructedText += '\n';
                  }
                });
              });
            });
          });
        });

        if (reconstructedText) {
          return reconstructedText;
        }
        
        // Fallback to the default text if reconstruction is empty
        const fullText = responseData.fullTextAnnotation.text;
        if (fullText) {
          return fullText;
        }
      }

      throw new Error('No text detected in the image. The document might be empty or unreadable.');
    } catch (error) {
      console.error('Google Cloud Vision API error:', error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = error => {
        console.error('Error reading file:', error);
        reject(error);
      };
    });
  }
}

// Alternative implementation using the Google Cloud Vision client library
// This requires the @google-cloud/vision package to be installed
export class GoogleCloudVisionClientService {
  constructor(credentials) {
    // This would be used if you have the @google-cloud/vision package installed
    // const vision = require('@google-cloud/vision');
    // this.client = new vision.ImageAnnotatorClient({ credentials });
    
    // For now, we'll use the REST API approach above
    throw new Error('Google Cloud Vision client library not available. Please install @google-cloud/vision package.');
  }

  async extractTextFromImage(imageFile) {
    // Implementation would go here if using the client library
    // const [result] = await this.client.textDetection(imageFile);
    // return result.fullTextAnnotation.text;
  }
} 