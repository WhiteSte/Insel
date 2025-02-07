// my-dicom-app/backend/graphql.js
const { gql } = require("apollo-server-express");
const axios = require("axios");
const { FilesTable, PatientTable, StudiesTable, ModalityTable, SeriesTable } = require("./models"); // This is your Sequelize model
const { v4: uuidv4 } = require('uuid');

const typeDefs = gql`
    type FilesTable {
        idFile: ID!
        idPatient: Int
        idStudy: Int
        idSeries: Int
        FilePath: String
    }

    type Query {
        files: [FilesTable]
    }

    type Mutation {
        uploadDicom(fileName: String!): String
    }
`;

const resolvers = {
    Query: {
        files: async () => {
            return FilesTable.findAll();
        },
    },
    Mutation: {
        uploadDicom: async (_, { fileName }) => {
            // This file has already been saved on disk by the upload route.
            // We call python-service to extract metadata.
            const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5050';
            const filePath = `/uploads/${fileName}`;

            // Send to python-service
            console.log(filePath)
         try {
             // 1) Call your Python service's parse endpoint
             const response = await axios.post(`${PYTHON_SERVICE_URL}/parse`, { filePath });

             // 2) Print the response from Python to th e Node console
             console.log('Python service output:', response.data);
             let { PatientID, SeriesInstanceUID, StudyInstanceUID, PatientName, Modality, SeriesDescription } = response.data;
             PatientID = PatientID || uuidv4(); // Assign UUID if null
             SeriesInstanceUID = SeriesInstanceUID || uuidv4();
             StudyInstanceUID = StudyInstanceUID || uuidv4();

             // 3) Check if Patient already exists
             let patient = await PatientTable.findByPk(PatientID);
             if (!patient) {
                 patient = await PatientTable.create({
                     idPatient: PatientID,
                     Name: PatientName,
                     CreatedDate: new Date(),
                 });
             }

             // 4) Check if Study already exists
             let study = await StudiesTable.findOne({ where: { idStudy: StudyInstanceUID } });
             if (!study) {
                 study = await StudiesTable.create({
                     idPatient: PatientID,
                     idStudy: StudyInstanceUID,
                     StudyName: 'test',
                 });
             }
             const  modality = await ModalityTable.create({Name: Modality})

             const serie = await SeriesTable.create({
                 idPatient: PatientID,
                 idStudy: StudyInstanceUID,
                 idSeries: SeriesInstanceUID,
                 idModality: modality.idModality,
                 SeriesName: SeriesDescription,
             });
             // 5) Check if File already exists
             let existingFile = await FilesTable.findOne({ where: { FilePath: filePath } });
             if (existingFile) {
                 console.log('File already exists, skipping insertion.');
                 return existingFile; // Return existing file instead of inserting
             }
             const dicomFile = await FilesTable.create({
                 idPatient: PatientID,
                 idStudy: StudyInstanceUID,
                 idSeries: SeriesInstanceUID,
                 idFile: uuidv4(),
                 FilePath: filePath,
                 CreatedDate: Date.now(),
             });
             
             // 3) Return something to the client
             return dicomFile;
         } catch (error) {
             console.error('Error calling Python service:', error);
             // Propagate error to the GraphQL client
             throw new Error('Python service call failed');
         }
        },
    },
};

module.exports = { typeDefs, resolvers };