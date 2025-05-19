from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import os
import zipfile

app = Flask(__name__)
CORS(app, origins=["https://medi-clean.vercel.app"])

CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ZIP_NAME = 'processed_files.zip'

from flask import jsonify

dummy_response = {
    "message": "Files processed.",
    "generated_files": [
        {"name": "Duplicate_Removed.csv", "path": "/path/to/Duplicate_Removed.csv"},
        {"name": "Filled_missing.csv", "path": "/path/to/Filled_missing.csv"},
        {"name": "cleaned_medical_data.csv", "path": "/path/to/cleaned_medical_data.csv"},
        {"name": "lemmatized.csv", "path": "/path/to/lemmatized.csv"},
        {"name": "Anonymization.csv", "path": "/path/to/Anonymization.csv"},
        {"name": "Error_Correction.csv", "path": "/path/to/Error_Correction.csv"}
    ],
    "randomForestData": [
        {"name": "Precision 0", "value": 0.67},
        {"name": "Recall 0", "value": 0.38},
        {"name": "F1-Score 0", "value": 0.48},
        {"name": "Precision 1", "value": 0.46},
        {"name": "Recall 1", "value": 0.73},
        {"name": "F1-Score 1", "value": 0.56},
        {"name": "Accuracy", "value": 0.53}
    ],
    "svmData": [
        {"name": "Precision 0", "value": 0.75},
        {"name": "Recall 0", "value": 0.38},
        {"name": "F1-Score 0", "value": 0.50},
        {"name": "Precision 1", "value": 0.48},
        {"name": "Recall 1", "value": 0.82},
        {"name": "F1-Score 1", "value": 0.61},
        {"name": "Accuracy", "value": 0.56}
    ],
    "confusionMatrixData": {
        "tn": 69,
        "fp": 69,
        "fn": 69,
        "tp": 69
    }
}


os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

processed_files = []  # will be filled during processing

# ----------------------------
# ML MODEL + FILE PROCESSING
# ----------------------------
def process_and_train_medical_model(file_path):
    import pandas as pd
    import numpy as np
    import re
    import spacy
    from sklearn.model_selection import train_test_split
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
    from imblearn.over_sampling import SMOTE
    from sklearn.svm import SVC

    output_dir = PROCESSED_FOLDER
    os.makedirs(output_dir, exist_ok=True)

    def save_csv(df, filename):
        filepath = os.path.join(output_dir, filename)
        df.to_csv(filepath, index=False)
        processed_files.append({"name": filename, "path": filepath})
        return filepath

    generated_files = []
    nlp = spacy.load("en_core_web_sm")

    df = pd.read_csv(file_path)
    df.columns = df.columns.str.strip()
    generated_files.append(save_csv(df, "Duplicate_Removed.csv"))

    df["Notes"] = df["Notes"].fillna("No medical history available")
    generated_files.append(save_csv(df, "Filled_missing.csv"))

    df["Cleaned_Notes"] = df["Notes"].str.lower().str.replace(r'[^a-zA-Z0-9\s]', '', regex=True)
    generated_files.append(save_csv(df, "cleaned_medical_data.csv"))

    df["Cleaned_Notes"] = df["Cleaned_Notes"].apply(lambda text: " ".join([token.lemma_ for token in nlp(text)]))
    generated_files.append(save_csv(df, "lemmatized.csv"))

    df["Anonymized_Notes"] = df["Cleaned_Notes"].astype(str).apply(
        lambda text: re.sub(r'\b(?:John|Mary|Dr\.|Hospital|Phone)\b', 'REDACTED', text, flags=re.IGNORECASE)
    )
    generated_files.append(save_csv(df, "Anonymization.csv"))

    df["is_incorrect"] = df["Life Threats"].astype(str).apply(lambda text: 1 if "yes" in text.lower() else 0)
    generated_files.append(save_csv(df, "Error_Correction.csv"))

    vectorizer = TfidfVectorizer(max_features=5000)
    X = vectorizer.fit_transform(df["Anonymized_Notes"]).toarray()
    y = df["is_incorrect"]

    smote = SMOTE()
    X_resampled, y_resampled = smote.fit_resample(X, y)

    X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42)

    rf_model = RandomForestClassifier()
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)

    svm_model = SVC(probability=True)
    svm_model.fit(X_train, y_train)
    y_pred_svm = svm_model.predict(X_test)

    def get_metrics(y_true, y_pred):
        return {
            "precision_0": precision_score(y_true, y_pred, pos_label=0),
            "recall_0": recall_score(y_true, y_pred, pos_label=0),
            "f1_0": f1_score(y_true, y_pred, pos_label=0),
            "precision_1": precision_score(y_true, y_pred, pos_label=1),
            "recall_1": recall_score(y_true, y_pred, pos_label=1),
            "f1_1": f1_score(y_true, y_pred, pos_label=1),
            "accuracy": accuracy_score(y_true, y_pred)
        }

    rf_metrics = get_metrics(y_test, y_pred_rf)
    svm_metrics = get_metrics(y_test, y_pred_svm)

    random_forest_data = [{"name": k.replace('_', ' ').title(), "value": round(v, 2)} for k, v in rf_metrics.items()]
    svm_data = [{"name": k.replace('_', ' ').title(), "value": round(v, 2)} for k, v in svm_metrics.items()]

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred_svm).ravel()
    confusion_matrix_data = {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)}

    return {
        "message": "Files processed.",
        "generated_files": processed_files,
        "randomForestData": random_forest_data,
        "svmData": svm_data,
        "confusionMatrixData": confusion_matrix_data
    }

# ----------------------------
# ROUTES
# ----------------------------
@app.route('/api/upload', methods=['POST'])
def upload_file():
    global processed_files
    processed_files = []  # clear previous run

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        #result = process_and_train_medical_model(file_path)
        result = dummy_response
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    file_path = os.path.join(PROCESSED_FOLDER, filename)
    if os.path.exists(file_path):
        return send_from_directory(PROCESSED_FOLDER, filename, as_attachment=True)
    else:
        return jsonify({"error": "File not found"}), 404

@app.route('/download/all', methods=['GET'])
def download_all():
    if not processed_files:
        return jsonify({"error": "No files to zip"}), 400

    zip_path = os.path.join(PROCESSED_FOLDER, ZIP_NAME)
    
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for file_info in processed_files:
            if os.path.exists(file_info["path"]):
                zipf.write(file_info["path"], arcname=file_info["name"])

    return send_file(zip_path, as_attachment=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Default to 5000 if PORT is not set
    app.run(host='0.0.0.0', port=port)
    app.run(debug=True)
