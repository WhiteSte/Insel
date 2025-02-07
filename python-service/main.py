# python-service/app.py
from flask import Flask, request, jsonify
import json
from dicom_parser import convert_dicom  # or rename your function
import os

app = Flask(__name__)


@app.route("/parse", methods=["POST"])
def parse_dicom():
    """
    Expects JSON body: { "filePath": "/path/to/file.dcm" }
    Returns: { ...parsed DICOM JSON... }
    """
    data = request.get_json()
    # print(data)
    file_path = data.get("filePath")
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "Invalid filePath " + file_path}), 400

    # Reuse your function from main.py
    try:
        result = convert_dicom(file_path, output_type="json", with_metadata=False)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug= True)

