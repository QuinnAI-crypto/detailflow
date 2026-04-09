module.exports = async (req, res) => {
  try {
    process.env.VERCEL = '1';
    process.env.NODE_ENV = 'production';
    const mod = require('./app.cjs');
    const handler = mod.default;
    if (typeof handler === 'function') {
      return handler(req, res);
    }
    res.status(500).json({ error: 'Handler type: ' + typeof handler, keys: Object.keys(mod || {}) });
  } catch (err) {
    res.status(500).json({ 
      error: err.message, 
      stack: err.stack?.split('\n').slice(0, 5)
    });
  }
};
