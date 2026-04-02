import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';

interface ContentContextStepProps {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
}

export function ContentContextStep({ uploadedFile, setUploadedFile }: ContentContextStepProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setUploadedFile(files[0]),
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <Upload className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Reference Document</h3>
      </div>
      {!uploadedFile ? (
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}>
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-lg font-medium text-gray-900">Upload reference document</p>
          <p className="text-xs text-gray-500 leading-relaxed">PDF or TXT up to 10MB</p>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-orange-600" />
            <p className="font-semibold text-orange-900">{uploadedFile.name}</p>
          </div>
          <button onClick={() => setUploadedFile(null)} className="text-orange-600"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}