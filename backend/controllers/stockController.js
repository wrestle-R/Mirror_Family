const Groq = require('groq-sdk');
const axios = require('axios');
const StockRecommendation = require('../models/StockRecommendation');
const StudentProfile = require('../models/StudentProfile');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Popular Indian stocks for recommendations
const INDIAN_STOCKS = {
  largeCap: [
    { symbol: 'RELIANCE.BSE', name: 'Reliance Industries', sector: 'Energy & Petrochemicals' },
    { symbol: 'TCS.BSE', name: 'Tata Consultancy Services', sector: 'IT Services' },
    { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank', sector: 'Banking' },
    { symbol: 'INFY.BSE', name: 'Infosys', sector: 'IT Services' },
    { symbol: 'ICICIBANK.BSE', name: 'ICICI Bank', sector: 'Banking' },
    { symbol: 'HINDUNILVR.BSE', name: 'Hindustan Unilever', sector: 'FMCG' },
    { symbol: 'ITC.BSE', name: 'ITC Limited', sector: 'FMCG & Tobacco' },
    { symbol: 'BHARTIARTL.BSE', name: 'Bharti Airtel', sector: 'Telecom' },
    { symbol: 'SBIN.BSE', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'BAJFINANCE.BSE', name: 'Bajaj Finance', sector: 'Financial Services' }
  ],
  midCap: [
    { symbol: 'ADANIENT.BSE', name: 'Adani Enterprises', sector: 'Conglomerate' },
    { symbol: 'TATAMOTORS.BSE', name: 'Tata Motors', sector: 'Automobile' },
    { symbol: 'SUNPHARMA.BSE', name: 'Sun Pharmaceutical', sector: 'Pharmaceuticals' },
    { symbol: 'WIPRO.BSE', name: 'Wipro', sector: 'IT Services' },
    { symbol: 'MARUTI.BSE', name: 'Maruti Suzuki', sector: 'Automobile' }
  ],
  tech: [
    { symbol: 'TCS.BSE', name: 'Tata Consultancy Services', sector: 'IT Services' },
    { symbol: 'INFY.BSE', name: 'Infosys', sector: 'IT Services' },
    { symbol: 'WIPRO.BSE', name: 'Wipro', sector: 'IT Services' },
    { symbol: 'HCLTECH.BSE', name: 'HCL Technologies', sector: 'IT Services' },
    { symbol: 'TECHM.BSE', name: 'Tech Mahindra', sector: 'IT Services' }
  ],
  banking: [
    { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank', sector: 'Banking' },
    { symbol: 'ICICIBANK.BSE', name: 'ICICI Bank', sector: 'Banking' },
    { symbol: 'SBIN.BSE', name: 'State Bank of India', sector: 'Banking' },
    { symbol: 'KOTAKBANK.BSE', name: 'Kotak Mahindra Bank', sector: 'Banking' },
    { symbol: 'AXISBANK.BSE', name: 'Axis Bank', sector: 'Banking' }
  ]
};

// Fetch stock data from Alpha Vantage
const fetchStockData = async (symbol) => {
  try {
    // Remove .BSE suffix for Alpha Vantage API (use base symbol)
    const baseSymbol = symbol.replace('.BSE', '');
    
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: baseSymbol,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const quote = response.data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      // Return mock data if API fails or rate limited
      return {
        price: Math.random() * 2000 + 500,
        change: (Math.random() - 0.5) * 50,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 10000000),
        high: Math.random() * 2100 + 500,
        low: Math.random() * 1900 + 500
      };
    }

    return {
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
      volume: parseInt(quote['06. volume']) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error.message);
    // Return mock data on error
    return {
      price: Math.random() * 2000 + 500,
      change: (Math.random() - 0.5) * 50,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 10000000),
      high: Math.random() * 2100 + 500,
      low: Math.random() * 1900 + 500
    };
  }
};

// Get existing recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const recommendations = await StockRecommendation.findOne({ student: student._id })
      .sort({ lastUpdated: -1 });

    if (!recommendations) {
      return res.status(200).json({ data: null, message: 'No recommendations found. Please generate.' });
    }

    res.status(200).json({ data: recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate personalized stock recommendations
exports.generateRecommendations = async (req, res) => {
  try {
    const { firebaseUid, preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ message: 'Preferences are required' });
    }

    const student = await Student.findOne({ firebaseUid });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({ student: student._id });
    const transactions = await Transaction.find({ student: student._id })
      .sort({ date: -1 })
      .limit(100);

    // Calculate user's financial metrics
    const monthlyIncome = profile?.monthlyIncome || 0;
    const currentSavings = profile?.currentSavings || 0;
    const totalExpenses = profile?.getTotalExpenses() || 0;
    const savingsPotential = monthlyIncome - totalExpenses;

    // Select stocks based on preferences
    let stockPool = [];
    
    if (preferences.riskAppetite === 'conservative') {
      stockPool = [...INDIAN_STOCKS.largeCap, ...INDIAN_STOCKS.banking];
    } else if (preferences.riskAppetite === 'moderate') {
      stockPool = [...INDIAN_STOCKS.largeCap, ...INDIAN_STOCKS.midCap, ...INDIAN_STOCKS.tech];
    } else {
      stockPool = [...INDIAN_STOCKS.midCap, ...INDIAN_STOCKS.tech, ...INDIAN_STOCKS.largeCap];
    }

    // Filter by sector preferences if specified
    if (preferences.sectors && preferences.sectors.length > 0) {
      stockPool = stockPool.filter(stock => 
        preferences.sectors.some(sector => 
          stock.sector.toLowerCase().includes(sector.toLowerCase())
        )
      );
    }

    // Limit to 6-8 stocks
    const selectedStocks = stockPool.slice(0, 8);

    // Fetch real-time data for selected stocks
    const stockDataPromises = selectedStocks.map(async (stock) => {
      const marketData = await fetchStockData(stock.symbol);
      return {
        ...stock,
        marketData
      };
    });

    const stocksWithData = await Promise.all(stockDataPromises);

    // Prepare context for AI
    const contextData = {
      userProfile: {
        monthlyIncome,
        currentSavings,
        savingsPotential,
        riskTolerance: profile?.riskTolerance || preferences.riskAppetite,
        financialLiteracy: profile?.financialLiteracy || 'Beginner',
        age: profile?.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : 22
      },
      preferences: {
        investmentHorizon: preferences.investmentHorizon,
        riskAppetite: preferences.riskAppetite,
        investmentAmount: preferences.investmentAmount,
        sectors: preferences.sectors,
        investmentGoal: preferences.investmentGoal,
        experienceLevel: preferences.experienceLevel
      },
      availableStocks: stocksWithData.map(s => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
        currentPrice: s.marketData.price,
        change: s.marketData.change,
        changePercent: s.marketData.changePercent
      })),
      recentTransactions: transactions.slice(0, 20).map(t => ({
        type: t.type,
        category: t.category,
        amount: t.amount,
        date: t.date
      }))
    };

    // AI Prompt for stock recommendations
    const systemPrompt = `You are an expert stock market analyst specializing in Indian equity markets. 
    Analyze the user's financial profile and preferences to provide personalized stock recommendations.
    
    Return a strict JSON object with NO markdown formatting.
    
    Required JSON Structure:
    {
      "recommendations": [
        {
          "symbol": "STOCK.BSE",
          "name": "Company Name",
          "sector": "Sector",
          "currentPrice": 1500,
          "recommendedAction": "buy/hold/watch",
          "allocation": 15,
          "rationale": "Detailed reason for recommendation (2-3 sentences)",
          "targetPrice": 1650,
          "stopLoss": 1400,
          "timeHorizon": "3-6 months",
          "riskLevel": "low/medium/high"
        }
      ],
      "portfolioAnalysis": {
        "diversificationScore": 85,
        "riskScore": 6.5,
        "expectedReturn": 12.5,
        "summary": "Overall portfolio assessment (2-3 sentences)",
        "strengths": ["Strength 1", "Strength 2"],
        "warnings": ["Warning 1", "Warning 2"]
      },
      "marketInsights": {
        "summary": "Current market overview (2-3 sentences)",
        "trends": ["Trend 1", "Trend 2", "Trend 3"],
        "opportunities": ["Opportunity 1", "Opportunity 2"]
      }
    }
    
    Guidelines:
    - Recommend 5-8 stocks from the available stocks list
    - Allocation percentages should sum to 100
    - Consider user's risk appetite and investment horizon
    - Provide realistic target prices (5-15% above current for short-term, 15-30% for long-term)
    - Set stop losses at 5-10% below current price
    - Rationale should be specific to the stock and user's profile
    - All amounts in INR (Indian Rupees)
    - Focus on fundamentally strong companies
    - Diversify across sectors
    - Match recommendations to user's experience level`;

    console.log(`Generating recommendations for user ${firebaseUid} with model llama-3.1-8b-instant`);

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `CONTEXT: ${JSON.stringify(contextData)}\n\nGenerate the stock recommendations JSON as requested.` }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const aiResponse = completion.choices[0]?.message?.content;
    let parsedRecommendations;

    try {
      parsedRecommendations = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse AI response", aiResponse);
      return res.status(500).json({ message: "AI response parsing failed", raw: aiResponse });
    }

    if (!parsedRecommendations || !Array.isArray(parsedRecommendations.recommendations)) {
      console.error("AI returned invalid structure:", parsedRecommendations);
      return res.status(500).json({ message: "AI returned invalid structure", data: parsedRecommendations });
    }

    // Enrich recommendations with real market data
    const enrichedRecommendations = parsedRecommendations.recommendations.map(rec => {
      const stockData = stocksWithData.find(s => s.symbol === rec.symbol);
      return {
        ...rec,
        marketData: {
          change: stockData?.marketData?.change || 0,
          changePercent: stockData?.marketData?.changePercent || 0,
          volume: stockData?.marketData?.volume || 0,
          marketCap: Math.floor(Math.random() * 500000 + 100000), // Mock market cap
          peRatio: Math.random() * 30 + 10,
          week52High: stockData?.marketData?.high || rec.currentPrice * 1.2,
          week52Low: stockData?.marketData?.low || rec.currentPrice * 0.8
        }
      };
    });

    // Save to database
    const recommendation = await StockRecommendation.findOneAndUpdate(
      { student: student._id },
      {
        preferences,
        recommendations: enrichedRecommendations,
        portfolioAnalysis: parsedRecommendations.portfolioAnalysis,
        marketInsights: parsedRecommendations.marketInsights,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ data: recommendation });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      message: 'Server error during recommendation generation', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get market overview
exports.getMarketOverview = async (req, res) => {
  try {
    // Fetch data for major indices (using representative stocks)
    const niftyStocks = ['RELIANCE.BSE', 'TCS.BSE', 'HDFCBANK.BSE'];
    
    const marketDataPromises = niftyStocks.map(symbol => fetchStockData(symbol));
    const marketData = await Promise.all(marketDataPromises);

    const avgChange = marketData.reduce((sum, data) => sum + data.changePercent, 0) / marketData.length;

    res.status(200).json({
      data: {
        trend: avgChange > 0 ? 'bullish' : 'bearish',
        changePercent: avgChange.toFixed(2),
        topGainers: INDIAN_STOCKS.largeCap.slice(0, 3),
        topLosers: INDIAN_STOCKS.midCap.slice(0, 3),
        sectors: [
          { name: 'IT Services', performance: 2.3 },
          { name: 'Banking', performance: 1.8 },
          { name: 'FMCG', performance: -0.5 },
          { name: 'Energy', performance: 1.2 }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search for stocks and get details
exports.searchStocks = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // 1. Search for symbols matching the query
    const searchResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    const matches = searchResponse.data.bestMatches || [];
    
    // Check if we hit API limit on search
    if (searchResponse.data.Note || searchResponse.data.Information) {
       console.log("Alpha Vantage limit reached (Search), returning mock for:", query);
    }
    
    if (matches.length === 0) {
      // Mock result if nothing found (or API limited) and query looks like a stock
      if (query.length > 2) {
          const mockSymbol = query.toUpperCase() + ".BSE";
          const mockData = await fetchStockData(mockSymbol);
          res.status(200).json({
              data: {
                  match: {
                      symbol: mockSymbol,
                      name: query.toUpperCase() + " Industries (Mock)",
                      type: "Equity",
                      region: "India",
                      currency: "INR"
                  },
                  marketData: mockData
              }
          });
          return; // Add return to prevent execution of filtered logic below
      }
      return res.status(200).json({ message: 'No stocks found', data: null });
    }

    // 2. Get detailed data for the top match
    const topMatch = matches[0];
    const symbol = topMatch['1. symbol'];
    const stockData = await fetchStockData(symbol);

    res.status(200).json({
      data: {
        match: {
          symbol: topMatch['1. symbol'],
          name: topMatch['2. name'],
          type: topMatch['3. type'],
          region: topMatch['4. region'],
          currency: topMatch['8. currency']
        },
        marketData: stockData
      }
    });

  } catch (error) {
    console.error('Error searching stocks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
