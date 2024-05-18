const { gql } = require('@apollo/server');
// Définir le schéma GraphQL
const typeDefs = `#graphql
type voiture {
id: String!
title: String!
description: String!
}
type camion {
id: String!
title: String!
description: String!
}
type Query {
voiture(id: String!): voiture
voitures: [voiture]
camion(id: String!): camion
camions: [camion]
addvoiture(title: String!, description: String!): voiture
addcamion(title: String!, description: String!): camion

}
`;
module.exports = typeDefs