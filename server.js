// server.js - Backend server to proxy requests to Ollama
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cors()); // Enable CORS for your frontend
app.use(bodyParser.json());
app.use(express.static('webpage')); // Serve your frontend files from the webpage directory

// Endpoint to get available models from Ollama
// This endpoint fetches the list of available models from Ollama
app.get('/api/models', async (req, res) => {
  try {
    // Make GET request to Ollama API to fetch available models
    const response = await axios.get('http://localhost:11434/api/tags');
    // Return the list of models as JSON response
    res.json(response.data);
  } catch (error) {
    // Log error and return error response
    console.error('Error fetching models:', error.message);
    res.status(500).json({ error: 'Failed to fetch models from Ollama' });
  }
});

// Endpoint to update the model configuration
// This endpoint allows updating the model configuration file
// Used when switching between different AI models
app.post('/api/update-modelfile', async (req, res) => {
  try {
    // Get the model configuration content from request
    const content = req.body;
    
    if (!content) {
      // Return error if no content provided
      return res.status(400).json({ error: 'Content is required' });
    }

    // Write the model configuration to file
    const fs = require('fs');
    fs.writeFileSync('Modelfile', content, 'utf8');
    
    // Return success response
    res.status(200).json({ success: true });
  } catch (error) {
    // Log error and return error response
    console.error('Error updating Modelfile:', error);
    res.status(500).json({ error: 'Failed to update Modelfile' });
  }
});

// Main chat endpoint that handles user messages
app.post('/api/chat', async (req, res) => {
  try {
    // Extract parameters from request body
    const { model, messages, temperature, personality } = req.body;
    
    // Validate required parameters
    if (!model || !messages) {
      return res.status(400).json({ error: 'Model and messages are required' });
    }

    // Format messages for Ollama
    // Creates an array of messages with role and content
    // First message is always the system message with personality
    const formattedMessages = [
      { role: 'system', content: personality },
      ...messages.map(msg => ({ role: msg.role, content: msg.content }))
    ];

    // Log the request parameters for debugging
    console.log('Sending to Ollama with parameters:', {
      model,
      temperature,
      messages: formattedMessages
    });

    // Make request to Ollama API
    const ollamaResponse = await axios.post('http://localhost:11434/api/generate', {
      model: model,                 // Model to use (e.g., llama2)
      prompt: formattedMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n'),
                                    // Format messages as single prompt string
      options: {
        temperature: temperature     // Controls response creativity (0.0-2.0)
      },
      system: personality,           // System message/personality
      stream: false                  // Return single response instead of streaming
    });

    // Format and return response to frontend
    res.json({
      model: model,
      message: {
        role: personality,           // Use personality name as role
        content: ollamaResponse.data.response
      }
    });
  } catch (error) {
    // Log error and return error response
    console.error('Error getting completion:', error.message);
    res.status(500).json({ error: 'Failed to get completion from Ollama' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
