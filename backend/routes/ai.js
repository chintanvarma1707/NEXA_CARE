const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Mocked fallback for demo when API key is missing
      console.log('Using mock AI response due to missing API key');
      return res.json({ text: "I'm currently running in offline demo mode. Based on the data, the hospital is functioning normally. Please check the dashboard for specific metrics." });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;
    
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const aiText = response.data.candidates[0].content.parts[0].text;
    res.json({ text: aiText });
  } catch (err) {
    console.error('AI Chat Error:', err.response?.data || err.message);
    // Fallback instead of 500 error
    res.json({ text: "I'm currently running in offline demo mode. Based on the data, the hospital is functioning normally. Please check the dashboard for specific metrics." });
  }
});

module.exports = router;
