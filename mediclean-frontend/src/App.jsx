import { useState } from "react";
import { Upload, FileText, Check, Download, ChevronRight, BarChart2, Database, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [activeTab, setActiveTab] = useState("files");
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [randomForestData, setRandomForestData] = useState([]);
  const [svmData, setSvmData] = useState([]);
  const [confusionMatrixData, setConfusionMatrixData] = useState({});


  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

const processFile = () => {
  if (!selectedFile) return;

  setIsProcessing(true);

  const formData = new FormData();
  formData.append("file", selectedFile);

  fetch("http://localhost:5000/api/upload", {
    method: "POST",
    body: formData,
  })
    .then(response => response.json())
    .then(data => {
      setIsProcessing(false);
      setProcessingComplete(true);
      setGeneratedFiles(data.generated_files);
      setRandomForestData(data.randomForestData);
      setSvmData(data.svmData);
      setConfusionMatrixData(data.confusionMatrixData);
    })
    .catch(error => {
      console.error("Upload failed:", error);
      setIsProcessing(false);
    });
};



const downloadFile = (fileName) => {
  fetch(`http://localhost:5000/download/${fileName}`)
    .then(response => {
      if (response.ok) {
        return response.blob();
      }
      throw new Error("Network error");
    })
    .then(blob => {
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(error => console.error("Download error:", error));
};

const downloadAllFiles = () => {
  fetch("http://localhost:5000/download/all")
    .then(response => {
      if (response.ok) {
        return response.blob();
      }
      throw new Error("Network error");
    })
    .then(blob => {
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "processed_files.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch(error => console.error("Download all error:", error));
};

  
  return (
    <div className=" bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-6 shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold flex items-center">
            <Database className="mr-2" /> 
            MediClean
            <span className="text-yellow-300 ml-2">NLP</span>
          </h1>
          <p className="mt-2 opacity-90">Advanced Healthcare Data Cleansing with Natural Language Processing</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        {/* File Upload Section */}
        <section className="mb-12">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-blue-700 flex items-center">
              <Upload className="mr-2" />
              Upload Medical Record
            </h2>
            
            <div className={`border-2 border-dashed rounded-lg p-10 text-center ${selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'}`}>
              {!selectedFile ? (
                <>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center">
                      <Upload size={48} className="text-blue-500 mb-4" />
                      <p className="text-lg">Drag and drop your CSV file here or click to browse</p>
                      <p className="text-sm text-gray-500 mt-2">Supports CSV files up to 50MB</p>
                    </div>
                  </label>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <Check size={48} className="text-green-500 mb-4" />
                  <p className="text-lg font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <div className="mt-4 flex gap-3">
                    <button
                      className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </button>
                    <button
                      className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition flex items-center"
                      onClick={processFile}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          Process File <ChevronRight className="ml-1" size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Section (visible after processing) */}
        {processingComplete && (
          <section className="mb-12">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b">
                <button
                  className={`py-3 px-6 font-medium flex items-center ${
                    activeTab === "files" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-500"
                  }`}
                  onClick={() => setActiveTab("files")}
                >
                  <FileText className="mr-2" size={18} />
                  Generated Files
                </button>
                <button
                  className={`py-3 px-6 font-medium flex items-center ${
                    activeTab === "analytics" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-blue-500"
                  }`}
                  onClick={() => setActiveTab("analytics")}
                >
                  <BarChart2 className="mr-2" size={18} />
                  Performance Analytics
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "files" && (
                  <div>
                    <div className="flex justify-between mb-4">
                      <h3 className="font-semibold text-lg">Processed Files</h3>
                      <button
                        className="bg-blue-600 text-white py-1 px-4 rounded text-sm hover:bg-blue-700 transition flex items-center"
                        onClick={downloadAllFiles}
                      >
                        <Download size={16} className="mr-1" /> Download All
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left table-auto">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 rounded-l-lg">File Name</th>
                            <th className="px-4 py-3">Size</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 rounded-r-lg">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {generatedFiles.map((file, index) => (
                            <tr key={index} className="hover:bg-blue-50">
                              <td className="px-4 py-3">{file.name}</td>
                              <td className="px-4 py-3">{file.size}</td>
                              <td className="px-4 py-3">
                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                  Ready
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  className="text-blue-600 hover:text-blue-800 flex items-center"
                                  onClick={() => downloadFile(file.name)}
                                >
                                  <Download size={16} className="mr-1" /> Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "analytics" && (
                  <div>
                    <h3 className="font-semibold text-lg mb-6">Model Performance Analytics</h3>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Random Forest Performance Chart */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-md font-medium mb-4">Random Forest Performance</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={randomForestData}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                              <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                              <Legend />
                              <Bar dataKey="value" name="Value" fill="#3b82f6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* SVM Performance Chart */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-md font-medium mb-4">SVM Performance</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={svmData}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                              <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                              <Legend />
                              <Bar dataKey="value" name="Value" fill="#10b981" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Confusion Matrix */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-md font-medium mb-4">Confusion Matrix - SVM Model</h4>
                        <div className="flex justify-center">
                          <div className="grid grid-cols-2 gap-1 w-64">
                            <div className="bg-blue-700 text-white p-4 text-center rounded-tl-lg">
                              <div className="text-xs mb-1">True Negative</div>
                              <div className="text-2xl font-bold">{confusionMatrixData.tn}</div>
                            </div>
                            <div className="bg-red-400 text-white p-4 text-center rounded-tr-lg">
                              <div className="text-xs mb-1">False Positive</div>
                              <div className="text-2xl font-bold">{confusionMatrixData.fp}</div>
                            </div>
                            <div className="bg-red-600 text-white p-4 text-center rounded-bl-lg">
                              <div className="text-xs mb-1">False Negative</div>
                              <div className="text-2xl font-bold">{confusionMatrixData.fn}</div>
                            </div>
                            <div className="bg-blue-500 text-white p-4 text-center rounded-br-lg">
                              <div className="text-xs mb-1">True Positive</div>
                              <div className="text-2xl font-bold">{confusionMatrixData.tp}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ROC Curve */}
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-md font-medium mb-4">ROC Curve</h4>
                        <div className="h-64 flex items-center justify-center">
                          <svg viewBox="0 0 400 300" className="w-full max-h-full">
                            {/* Axes */}
                            <line x1="50" y1="250" x2="350" y2="250" stroke="black" strokeWidth="2" />
                            <line x1="50" y1="250" x2="50" y2="50" stroke="black" strokeWidth="2" />
                            
                            {/* Labels */}
                            <text x="200" y="280" textAnchor="middle" fontSize="14">False Positive Rate</text>
                            <text x="20" y="150" textAnchor="middle" fontSize="14" transform="rotate(-90, 20, 150)">True Positive Rate</text>
                            
                            {/* Diagonal reference line */}
                            <line x1="50" y1="250" x2="350" y2="50" stroke="gray" strokeDasharray="5,5" strokeWidth="1" />
                            
                            {/* ROC Curve - Example curve for AUC = 0.68 */}
                            <path 
                              d="M50,250 Q100,200 150,120 T350,50" 
                              fill="none" 
                              stroke="blue" 
                              strokeWidth="3"
                            />
                            
                            {/* AUC Label */}
                            <text x="250" y="150" fontSize="16" fill="darkblue" fontWeight="bold">AUC = 0.68</text>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Info Cards */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-3 text-blue-700">NLP Processing Steps</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <Check className="text-green-500 mr-2" size={16} />
                Text Normalization
              </li>
              <li className="flex items-center">
                <Check className="text-green-500 mr-2" size={16} />
                Lemmatization
              </li>
              <li className="flex items-center">
                <Check className="text-green-500 mr-2" size={16} />
                Data De-identification
              </li>
              <li className="flex items-center">
                <Check className="text-green-500 mr-2" size={16} />
                Error Correction
              </li>
              <li className="flex items-center">
                <Check className="text-green-500 mr-2" size={16} />
                Feature Extraction
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-3 text-blue-700">Models Used</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>SVM Classifier</span>
                <span className="text-green-600 font-medium">56% Accuracy</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "56%" }}></div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <span>Random Forest</span>
                <span className="text-blue-600 font-medium">53% Accuracy</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "53%" }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-3 text-blue-700">Data Quality</h3>
            <div className="flex items-center mb-4">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16">
                  <path
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="75, 100"
                  />
                </svg>
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <span className="text-xl font-bold">75%</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-gray-600">Overall data quality score after processing</p>
              </div>
            </div>
            <div className="flex items-center mt-4">
              <AlertTriangle className="text-amber-500 mr-2" size={20} />
              <p className="text-sm text-gray-600">Class imbalance detected and corrected with SMOTE</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 MediClean NLP - Healthcare Data Cleansing Tool</p>
          <p className="text-gray-400 text-sm mt-2">Powered by Flask & React</p>
        </div>
      </footer>
    </div>
  );
}