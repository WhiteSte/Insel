// my-dicom-app/frontend/src/App.js
import React from 'react';
import { Container, Typography } from '@mui/material';
import DicomTable from './components/DicomTable';

function App() {
    return (
        <Container maxWidth="md" style={{ marginTop: '2rem' }}>
            <Typography variant="h4" gutterBottom>
                DICOM Viewerrrrrr
            </Typography>
            <DicomTable />
        </Container>
    );
}

export default App;
