import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, X, ArrowLeft, ArrowRight } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ColumnSelection from './ColumnSelection';
import SmartMapping from './SmartMapping';

interface FlexibleBulkImportProps {
  onClose: () => void;
  onImportComplete?: (importedColumns: string[]) => void;
}

interface FileColumn {
  name: string;
  index: number;
}

interface ColumnMapping {
  fileColumn: string;
  databaseColumn: string;
  isMapped: boolean;
}

interface ImportResult {
  inserted_count: number;
  error_count: number;
  errors: Array<{
    student_name: string;
    class_name: string;
    error: string;
  }>;
}

const FlexibleBulkImport: React.FC<FlexibleBulkImportProps> = ({ onClose, onImportComplete }) => {
  const { schoolId } = useAuth();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState<'upload' | 'select' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileColumns, setFileColumns] = useState<FileColumn[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);

  // Parse uploaded file
  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    
      reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      try {
        let parsedData: any[] = [];
        let headers: string[] = [];

        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          const result = Papa.parse(data as string, { 
            header: true, 
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
          });
          parsedData = result.data;
          headers = result.meta.fields || [];
        } else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length > 0) {
            headers = jsonData[0] as string[];
          parsedData = jsonData.slice(1).map((row: unknown) => {
            const obj: any = {};
            const rowArray = row as any[];
            headers.forEach((header, index) => {
              obj[header] = rowArray[index] || '';
            });
            return obj;
          });
          }
        }

        // Filter out empty rows
        parsedData = parsedData.filter(row => 
          Object.values(row).some(value => value && value.toString().trim() !== '')
        );

        setParsedData(parsedData);
        setFileColumns(headers.map((name, index) => ({ name, index })));
        setStep('select');
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please check the file format.');
      }
    };

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  }, []);


  // Handle column selection
  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  // Handle column mapping
  const handleMappingChange = (fileColumn: string, databaseColumn: string) => {
    setMappings(prev => {
      const existing = prev.find(m => m.fileColumn === fileColumn);
      if (existing) {
        return prev.map(m => 
          m.fileColumn === fileColumn 
            ? { ...m, databaseColumn, isMapped: !!databaseColumn }
            : m
        );
          } else {
        return [...prev, { fileColumn, databaseColumn, isMapped: !!databaseColumn }];
      }
    });
  };

  const handleRemoveMapping = (fileColumn: string) => {
    setMappings(prev => prev.filter(m => m.fileColumn !== fileColumn));
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || !parsedData.length) return;

      // Prepare data for import
      const importData = parsedData.map(row => {
        const studentData: any = {};
        
        mappings.forEach(mapping => {
          if (mapping.isMapped && mapping.databaseColumn) {
            const value = row[mapping.fileColumn];
            if (value && value.toString().trim() !== '') {
              studentData[mapping.databaseColumn] = value.toString().trim();
            }
          }
        });

        return studentData;
      }).filter(data => Object.keys(data).length > 0);

      // Call the updated bulk insert function
      const { data, error } = await supabase.rpc('bulk_insert_students', {
        p_students_data: importData,
        p_school_id: schoolId,
        p_selected_columns: selectedColumns
      });
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: (data) => {
      setImportResults(data);
      setStep('complete');
      queryClient.invalidateQueries({ queryKey: ['students', schoolId] });
      // Notify parent about imported columns
      if (onImportComplete) {
        onImportComplete(selectedColumns);
      }
    },
    onError: (error) => {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    }
  });

  // Handle import
  const handleImport = () => {
    setStep('importing');
    importMutation.mutate();
  };

  // Reset component
  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setFileColumns([]);
    setSelectedColumns([]);
    setMappings([]);
    setParsedData([]);
    setImportResults(null);
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Student Data File
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Upload a CSV or Excel file with your student information
            </p>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop your file here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports CSV and Excel files
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFile(file);
                  parseFile(file);
                }
              }}
              className="hidden"
            />
          </div>
        );

      case 'select':
  return (
          <ColumnSelection
            selectedColumns={selectedColumns}
            onColumnToggle={handleColumnToggle}
            availableColumns={fileColumns.map(col => ({
              id: col.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              name: col.name,
              displayName: col.name,
              type: 'text',
              category: 'custom'
            }))}
          />
        );

      case 'mapping':
        return (
          <SmartMapping
            fileColumns={fileColumns}
            selectedColumns={selectedColumns}
            mappings={mappings}
            onMappingChange={handleMappingChange}
            onRemoveMapping={handleRemoveMapping}
          />
        );

      case 'preview':
        return (
          <div className="space-y-4">
              <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preview Import Data
              </h3>
              <p className="text-sm text-gray-600">
                Review the data that will be imported
                </p>
              </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>File:</strong> {file?.name} ({parsedData.length} rows)
                  </div>
              <div className="text-sm text-gray-600 mb-4">
                <strong>Selected Columns:</strong> {selectedColumns.length} columns
                  </div>
              <div className="text-sm text-gray-600">
                <strong>Mapped Columns:</strong> {mappings.filter(m => m.isMapped).length} mappings
                </div>
              </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-900">Sample Data (First 5 rows)</h4>
                </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {mappings.filter(m => m.isMapped).map(mapping => (
                        <th key={mapping.fileColumn} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {mapping.fileColumn}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {mappings.filter(m => m.isMapped).map(mapping => (
                          <td key={mapping.fileColumn} className="px-4 py-2 text-sm text-gray-900">
                            {row[mapping.fileColumn] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        );

      case 'importing':
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Importing Students...
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we import your student data
            </p>
                    </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Import Complete!
            </h3>
            {importResults && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-sm text-green-800">
                  <p><strong>Successfully imported:</strong> {importResults.inserted_count} students</p>
                  {importResults.error_count > 0 && (
                    <p><strong>Errors:</strong> {importResults.error_count} rows failed</p>
                  )}
                </div>
              </div>
            )}
                <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
              Import More Students
                </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Flexible Bulk Import
          </h2>
                <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
                >
            <X className="h-6 w-6" />
                </button>
              </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {renderStepContent()}
            </div>

        {step !== 'upload' && step !== 'importing' && step !== 'complete' && (
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              onClick={() => {
                if (step === 'select') {
                  setStep('upload');
                } else if (step === 'mapping') {
                  setStep('select');
                } else if (step === 'preview') {
                  setStep('mapping');
                }
              }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="flex space-x-2">
              {step === 'select' && (
                <button
                  onClick={() => setStep('mapping')}
                  disabled={selectedColumns.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {step === 'mapping' && (
                <button
                  onClick={() => setStep('preview')}
                  disabled={mappings.filter(m => m.isMapped).length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              {step === 'preview' && (
                <button
                  onClick={handleImport}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <span>Import Students</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default FlexibleBulkImport;