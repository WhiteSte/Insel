import numpy as np
from PIL import Image
from numpy import maximum, ndarray
from pydicom import dcmread, FileDataset
from pydicom.multival import MultiValue
from pydicom.valuerep import PersonName
import sys
import json
 
def getDicomValue(ds, name):
    value = ds.get(name)
    if value is None:
        return ""
    if isinstance(value, MultiValue):
        array = np.array(value)
        # Convert NumPy array to list
        return array.tolist()
    if isinstance(value, PersonName):
        return value.formatted("format_str")  # Adjust as needed
    if isinstance(value, np.ndarray):
        return value.tolist()  # Convert NumPy arrays to lists
    if isinstance(value, (np.floating, np.integer)):
        return value.item()  # Convert NumPy scalar to native Python type
    return value


def convert_dicom(filepath, output_type="json", with_metadata=False):
    # https://pydicom.github.io/pydicom/stable/tutorials/dataset_basics.html
    # Extract dataset from dcm file
    # https://pydicom.github.io/pydicom/stable/reference/dataset.html
    ds = dcmread(filepath)
    # Extract the pixel data from dataset
    pixel_data = ds.pixel_array
    try:
        rescale_intercept = ds.RescaleIntercept
    except:
        rescale_intercept = 0
    # Convert to float to avoid overflow or underflow losses.
    pixel_data_float = pixel_data.astype(float)
    pixel_data_float += rescale_intercept
    maximum = np.amax(pixel_data_float)
    minimum = np.amin(pixel_data_float)
    # Rescaling grey scale between 0-255
    pixel_data_float_scaled = (
        np.maximum(pixel_data_float, 0) / pixel_data_float.max(initial=0) * 255.0
    )
    # Convert to uint8 ndarray
    pixel_data_uint8_scaled = np.uintc(pixel_data_float_scaled)
    SliceLocation = getDicomValue(ds, "SliceLocation")
    ImageOrientationPatient = getDicomValue(ds, "ImageOrientationPatient")
    ImagePositionPatient = getDicomValue(ds, "ImagePositionPatient")
    InstanceNumber = getDicomValue(ds, "InstanceNumber")
    if output_type == "json":
        # Convert array to list
        PixelSpacing = getDicomValue(ds, "PixelSpacing")
        Modality = getDicomValue(ds, "Modality")
        SeriesDescription = getDicomValue(ds, "SeriesDescription")
        ProtocolName = getDicomValue(ds, "ProtocolName")
        PatientName = getDicomValue(ds, "PatientName")
        StudyDate = getDicomValue(ds, "StudyDate")
        StudyTime = getDicomValue(ds, "StudyTime")
        SliceThickness = getDicomValue(ds, "SliceThickness")
        SpacingBetweenSlices = getDicomValue(ds, "SpacingBetweenSlices")
        RepetitionTime = getDicomValue(ds, "RepetitionTime")
        EchoTime = getDicomValue(ds, "EchoTime")
        ImageType = getDicomValue(ds, "ImageType")
        MagneticFieldStrength = getDicomValue(ds, "MagneticFieldStrength")
        SeriesNumber = getDicomValue(ds, "SeriesNumber")
        NumberOfFrames = getDicomValue(ds, "NumberOfFrames")
        StudyDescription = getDicomValue(ds, "StudyDescription")
        PatientID = getDicomValue(ds, "PatientID")
        SeriesInstanceUID = getDicomValue(ds, "SeriesInstanceUID")
        StudyInstanceUID = getDicomValue(ds, "StudyInstanceUID")
        PatientBirthDate = getDicomValue(ds, "PatientBirthDate")
        output_json = {
            "slices": [
                {
                    "image": pixel_data_uint8_scaled.tolist(),
                    "InstanceNumber": InstanceNumber,
                    "SliceLocation": SliceLocation,
                    "ImageOrientationPatient": ImageOrientationPatient,
                    "ImagePositionPatient": ImagePositionPatient,
                    "filepath": filepath,
                }
            ],
            "width": ds.Columns,
            "height": ds.Rows,
            "minimum": float(minimum),
            "maximum": float(maximum),
            "Modality": Modality,
            "SeriesDescription": SeriesDescription,
            "PatientName": PatientName,
            "PatientBirthDate": PatientBirthDate,
            "PatientID": PatientID,
            "SeriesInstanceUID": SeriesInstanceUID,
            "StudyInstanceUID": StudyInstanceUID,
            "StudyDate": StudyDate,
            "StudyTime": StudyTime,
            "SliceThickness": SliceThickness,
            "SpacingBetweenSlices": SpacingBetweenSlices,
            "ProtocolName": ProtocolName,
            "RepetitionTime": RepetitionTime,
            "EchoTime": EchoTime,
            "MagneticFieldStrength": MagneticFieldStrength,
            "SeriesNumber": SeriesNumber,
            "NumberOfFrames": NumberOfFrames,
            "PixelSpacing": PixelSpacing,
            "ImageType": ImageType,
            "StudyDescription": StudyDescription,
        }
        if with_metadata:
            output_json["metadata"] = ds.to_json_dict()
        return output_json
    return {
            "image": pixel_data_uint8_scaled.tolist(),
            "InstanceNumber": InstanceNumber,
            "SliceLocation": SliceLocation,
            "ImageOrientationPatient": ImageOrientationPatient,
            "ImagePositionPatient": ImagePositionPatient,
            "filepath": filepath,
        }
