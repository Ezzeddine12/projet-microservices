// resolvers.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
// Charger les fichiers proto pour les films et les séries TV
const voitureProtoPath = 'voiture.proto';
const camionProtoPath = 'camion.proto';
const voitureProtoDefinition = protoLoader.loadSync(voitureProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const camionProtoDefinition = protoLoader.loadSync(camionProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const voitureProto = grpc.loadPackageDefinition(voitureProtoDefinition).voiture;
const camionProto = grpc.loadPackageDefinition(camionProtoDefinition).camion;
// Définir les résolveurs pour les requêtes GraphQL
const resolvers = {
    Query: {
        voiture: (_, { id }) => {
            // Effectuer un appel gRPC au microservice de films
            const client = new voitureProto.voitureService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.getvoiture({ voiture_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.voiture);
                    }
                });
            });
        },
        addvoiture: (_, { title,description }) => {
            // Effectuer un appel gRPC au microservice de films
            const client = new voitureProto.voitureService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.addvoiture({ title: title,description:description }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.voiture);
                    }
                });
            });
        },
        voitures: () => {
            // Effectuer un appel gRPC au microservice de films
            const client = new voitureProto.voitureService('localhost:50051',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.searchvoitures({}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.voitures);
                    }
                });
            });
        },
        addcamion: (_, { title,description }) => {
            // Effectuer un appel gRPC au microservice de films
            const client = new camionProto.camionService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.addcamion({ title: title,description:description }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_show);
                    }
                });
            });
        },
         camion: (_, { id }) => {
            // Effectuer un appel gRPC au microservice de séries TV
            const client = new camionProto.camionService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.getcamion({ tv_show_id: id }, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_show);
                    }
                });
            });
        },
        camions: () => {
            // Effectuer un appel gRPC au microservice de séries TV
            const client = new camionProto.camionService('localhost:50052',
                grpc.credentials.createInsecure());
            return new Promise((resolve, reject) => {
                client.searchcamions({}, (err, response) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(response.tv_shows);
                    }
                });
            });
        },
    },
};
module.exports = resolvers;