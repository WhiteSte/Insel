As part of the interview process, we kindly ask you to complete the following exercise using the specified technologies:
- Docker:https://www.docker.com/resources/what-container
- Python: Use the PyDicom library to read DICOM files (an example is provided in the attached PPT).
- MySQL: https://hub.docker.com/_/mysql
- Node.js: https://hub.docker.com/_/node
- Database Query System: https://sequelize.org/
- API Integration: https://graphql.org/
- Web Interface: https://mui.com/ and https://reactjs.org/
- Web API for Queries: https://github.com/axios/axios
- DICOM Images for the Exercise: https://mb-neuro.medical-blocks.ch/shared/file/f1fcd7e0-dcb7-11ef-bab9-d5719e95527c

Exercise Requirements:
Please develop a small full-stack application that performs the following:
1. File Upload: Implement drag-and-drop functionality to upload a DICOM file (use the provided example files).
2. Data Display: Show the uploaded DICOM information in a table. Each row should include:
 - Patient Name
 - Patient Birth Date
 - Series Description
 - A button to download the file
4. DICOM Image Preview: Add a button in the table to display the DICOM image.
5. Docker Configuration: Ensure the application can run using docker-compose. Include a docker-compose.yml file in your GitHub repository.

# How to run
cd my-dicom-app
docker-compose build
docker-compose up