const mongoose = require('mongoose');

const voitureSchema = new mongoose.Schema({
    title: String,
    description: String,
});

const voiture = mongoose.model('voiture', voitureSchema);

module.exports = voiture;