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
    type File {
        id: ID!
        fileName: String!
        patientName: String
        patientBirthDate: String
        serieName: String
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
        files: async (_, { patientId }) => {
            try {
                const files = await FilesTable.findAll({
                    // Corrected from File to FilesTable
                    include: [
                        {
                            model: PatientTable, // Ensure correct model reference
                            as: 'patient',
                            attributes: ['Name', 'BirthDate'], // Use correct DB column names
                            where: { idPatient: patientId }, // Use correct column name for filtering
                            required: false, // Allow files without patient data
                        },
                        {
                            model: SeriesTable,
                            as: 'series',
                            attributes: ['SeriesName'], // Use correct column name for series
                            required: false, // Allow files without series data
                        },
                    ],
                });

                return files.map((file) => ({
                    id: file.idFile, // Use correct column name
                    fileName: file.FilePath, // Assuming FilePath stores the filename
                    patientName: file.patient ? file.patient.Name : null,
                    patientBirthDate: file.patient ? file.patient.BirthDate : null,
                    serieName: file.series ? file.series.SeriesName : null,
                }));
            } catch (error) {
                console.error('Error fetching files:', error);
                throw new Error('Failed to fetch files');
            }
        },
    },
    Mutation: {
        uploadDicom: async (_, { fileName }) => {
            // This file has already been saved on disk by the upload route.
            // We call python-service to extract metadata.
            const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5050';
            const filePath = `/uploads/${fileName}`;

            // Send to python-service
            console.log(filePath);
            try {
                // 1) Call your Python service's parse endpoint
                const response = await axios.post(`${PYTHON_SERVICE_URL}/parse`, { filePath });

                // 2) Print the response from Python to th e Node console
                console.log('Python service output:', response.data);
                let { PatientID, SeriesInstanceUID, StudyInstanceUID, PatientName, PatientBirthDate, Modality, SeriesDescription } = response.data;
                PatientID = PatientID || uuidv4(); // Assign UUID if null
                SeriesInstanceUID = SeriesInstanceUID || uuidv4();
                StudyInstanceUID = StudyInstanceUID || uuidv4();

                // 3) Check if Patient already exists
                let patient = await PatientTable.findByPk(PatientID);
                if (!patient) {
                    patient = await PatientTable.create({
                        idPatient: PatientID,
                        BirthDate: PatientBirthDate,
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
                const modality = await ModalityTable.create({ Name: Modality });

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