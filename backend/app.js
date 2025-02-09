// my-dicom-app/backend/app.js
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const bodyParser = require("body-parser");
const upload = require("./uploadMiddleware");
const { typeDefs, resolvers } = require("./graphql");
const cors = require("cors");

(async function startServer() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // GraphQL
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/graphql" });

  // REST endpoint for file upload
  app.post('/upload', upload.single('dicomFile'), (req, res) => {
      try {
          // The file is now in ./backend/uploads/<some-file>
          // You can store req.file.path in your DB if needed
          // For demonstration, we return the filename
          return res.json({
              success: true,
              fileName: req.file.filename,
              filePath: req.file.path,
          });
      } catch (error) {
          console.error('Upload failed:', error);
          return res.status(500).json({ success: false, error: 'Upload error' });
      }
  });

  // Route to download a file
  app.get("/download/:id", async (req, res) => {
    try {
      const { FilesTable } = require('./models');
      const dicom = await FilesTable.findByPk(req.params.id);
      if (!dicom) return res.status(404).send("Not found");
      res.download(dicom.filePath);
    } catch (err) {
      res.status(500).send("Error");
    }
  });

  // Serve previews if you want
  app.get("/preview/:id", async (req, res) => {
    const { DicomFile } = require("./models");
    const dicom = await DicomFile.findByPk(req.params.id);
    if (!dicom || !dicom.previewPath) return res.status(404).send("Not found");
    res.sendFile(dicom.previewPath);
  });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
})();