// my-dicom-app/frontend/src/components/DicomTable.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Modal } from '@mui/material';

// Adjust if needed based on your Docker setup
const backendUrl = 'http://localhost:4000';
const graphQLUrl = `${backendUrl}/graphql`;

const DicomTable = () => {
    const [filesList, setFilesList] = useState([]);
    const [file, setFile] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');

    // 1) Query the FilesTable with relations
    const fetchFiles = async () => {
        try {
            const query = `
              query {
          files {
            idFile
            idPatient
            idStudy
            idSeries
            FilePath
          }
        }
      `;
            const response = await axios.post(graphQLUrl, { query });
            // The shape here depends on how your GraphQL resolvers are named
            setFilesList(response.data.data.files || []);
        } catch (err) {
            console.error('Fetch files error:', err);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

 const handleDrop = (e) => {
     e.preventDefault();
     if (e.dataTransfer.files.length > 0) {
         const droppedFile = e.dataTransfer.files[0];

         // Check if it's a valid DICOM file (optional)
         if (!droppedFile.name.toLowerCase().endsWith('.dcm')) {
             console.error('Invalid file type');
             return;
         }

         setFile(droppedFile);
     }
 };

 const handleDragOver = (e) => {
     e.preventDefault();
     e.dataTransfer.dropEffect = 'copy'; // Ensure the cursor shows copy
 };

 const handleFileChange = (e) => {
     if (e.target.files && e.target.files.length > 0) {
         setFile(e.target.files[0]);
     }
 };

    // This calls a REST endpoint `/upload`, then a GraphQL mutation (as in your older setup).
    // Update to match how you create new FilesTable entries in your new schema.
  const handleUpload = async () => {
      if (!file) {
          console.error('No file selected');
          return;
      }

      try {
          const formData = new FormData();
          formData.append('dicomFile', file);

          const res = await axios.post(`${backendUrl}/upload`, formData);
          const { fileName } = res.data;

          // GraphQL mutation for file upload
          const mutation = `
        mutation {
            uploadDicom(fileName: "${fileName}")
        }`;

          await axios.post(graphQLUrl, { query: mutation });

          // Clear file selection and refresh list
          setFile(null);
          fetchFiles();
      } catch (error) {
          console.error('Upload error', error);
      }
  };

    // 3) Download / Preview logic (assuming your backend endpoints remain the same)
    const handleDownload = (idFile) => {
        window.location.href = `${backendUrl}/download/${idFile}`;
    };

    const handlePreview = (idFile) => {
        setCurrentPreviewUrl(`${backendUrl}/preview/${idFile}`);
        setPreviewModalOpen(true);
    };

    return (
        <div>
            {/* Drag-and-drop area */}
            <Box
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                sx={{
                    border: '2px dashed #ccc',
                    padding: '20px',
                    marginBottom: '10px',
                    textAlign: 'center',
                    backgroundColor: file ? '#e6f7ff' : 'transparent',
                }}
            >
                {file ? `File selected: ${file.name}` : 'Drag & Drop your DICOM file here'}
            </Box>

            {/* Traditional file input + Upload button */}
            <input type="file" onChange={handleFileChange} />
            <Button variant="contained" sx={{ ml: 2 }} onClick={handleUpload}>
                Upload
            </Button>

            {/* Table with new DB fields */}
            <TableContainer component={Paper} sx={{ marginTop: '20px' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Patient Name</TableCell>
                            <TableCell>Study Name</TableCell>
                            <TableCell>Series Name</TableCell>
                            <TableCell>Modality</TableCell>
                            <TableCell>File Path</TableCell>
                            <TableCell>Created Date</TableCell>
                            <TableCell>Download</TableCell>
                            <TableCell>Preview</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filesList.map((fileObj) => (
                            <TableRow key={fileObj.idFile}>
                                <TableCell>{fileObj.patientTable?.Name || '-'}</TableCell>
                                <TableCell>{fileObj.studiesTable?.StudyName || '-'}</TableCell>
                                <TableCell>{fileObj.seriesTable?.SeriesName || '-'}</TableCell>
                                <TableCell>{fileObj.seriesTable?.modalityTable?.Name || '-'}</TableCell>
                                <TableCell>{fileObj.FilePath}</TableCell>
                                <TableCell>{fileObj.CreatedDate}</TableCell>
                                <TableCell>
                                    <Button variant="outlined" onClick={() => handleDownload(fileObj.idFile)}>
                                        Download
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Button variant="outlined" onClick={() => handlePreview(fileObj.idFile)}>
                                        Preview
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal for image preview */}
            <Modal open={previewModalOpen} onClose={() => setPreviewModalOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '10%',
                        left: '30%',
                        width: '40%',
                        bgcolor: 'background.paper',
                        p: 2,
                    }}
                >
                    <img src={currentPreviewUrl} alt="DICOM Preview" style={{ width: '100%', height: 'auto' }} />
                </Box>
            </Modal>
        </div>
    );
};

export default DicomTable;
