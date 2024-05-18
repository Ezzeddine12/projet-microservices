const mongoose = require('mongoose');

const camionsSchema = new mongoose.Schema({
    title: String,
    description: String,
});

const camions = mongoose.model('camions', camionsSchema);

module.exports = camions;