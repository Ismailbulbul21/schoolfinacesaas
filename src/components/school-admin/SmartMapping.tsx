import React from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface FileColumn {
  name: string;
  index: number;
}

export interface ColumnMapping {
  fileColumn: string;
  databaseColumn: string;
  isMapped: boolean;
}

interface SmartMappingProps {
  fileColumns: FileColumn[];
  selectedColumns: string[];
  mappings: ColumnMapping[];
  onMappingChange: (fileColumn: string, databaseColumn: string) => void;
  onRemoveMapping: (fileColumn: string) => void;
}

const COLUMN_OPTIONS = [
  { id: 'name', displayName: 'Full Name' },
  { id: 'class_name', displayName: 'Class/Grade' },
  { id: 'email', displayName: 'Email' },
  { id: 'phone', displayName: 'Phone Number' },
  { id: 'parent_name', displayName: 'Parent Names' },
  { id: 'student_id', displayName: 'Student ID' },
  { id: 'date_of_birth', displayName: 'Date of Birth' },
  { id: 'gender', displayName: 'Gender' }
];

const SmartMapping: React.FC<SmartMappingProps> = ({
  fileColumns,
  selectedColumns,
  mappings,
  onMappingChange,
  onRemoveMapping
}) => {
  // Auto-suggest mappings based on column names
  const suggestMapping = (fileColumnName: string): string => {
    const name = fileColumnName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Direct matches
    if (name.includes('name') && !name.includes('parent')) return 'name';
    if (name.includes('class') || name.includes('grade') || name.includes('form')) return 'class_name';
    if (name.includes('email')) return 'email';
    if (name.includes('phone') || name.includes('mobile') || name.includes('contact')) return 'phone';
    if (name.includes('parent') && name.includes('name')) return 'parent_name';
    if (name.includes('student') && name.includes('id')) return 'student_id';
    if (name.includes('birth') || name.includes('dob') || name.includes('date')) return 'date_of_birth';
    if (name.includes('gender') || name.includes('sex')) return 'gender';
    
    return '';
  };

  const getMappingForFileColumn = (fileColumn: string): ColumnMapping | undefined => {
    return mappings.find(m => m.fileColumn === fileColumn);
  };

  const isColumnMapped = (fileColumn: string): boolean => {
    const mapping = getMappingForFileColumn(fileColumn);
    return mapping ? mapping.isMapped : false;
  };

  const getMappedDatabaseColumn = (fileColumn: string): string => {
    const mapping = getMappingForFileColumn(fileColumn);
    return mapping ? mapping.databaseColumn : '';
  };

  const getAvailableOptions = () => {
    return COLUMN_OPTIONS.filter(option => selectedColumns.includes(option.id));
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Map Your File Columns
        </h3>
        <p className="text-sm text-gray-600">
          Match your file columns to the selected database columns
        </p>
      </div>

      <div className="space-y-3">
        {fileColumns.map((fileColumn) => {
          const isMapped = isColumnMapped(fileColumn.name);
          const mappedColumn = getMappedDatabaseColumn(fileColumn.name);
          const suggestion = suggestMapping(fileColumn.name);
          
          return (
            <div key={fileColumn.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {fileColumn.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Column {fileColumn.index + 1}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {isMapped ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        <Check className="w-4 h-4" />
                        <span>
                          {COLUMN_OPTIONS.find(opt => opt.id === mappedColumn)?.displayName}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveMapping(fileColumn.name)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {suggestion && (
                        <button
                          onClick={() => onMappingChange(fileColumn.name, suggestion)}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                        >
                          Auto-map to {COLUMN_OPTIONS.find(opt => opt.id === suggestion)?.displayName}
                        </button>
                      )}
                      <select
                        value={mappedColumn}
                        onChange={(e) => onMappingChange(fileColumn.name, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select column...</option>
                        {getAvailableOptions().map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
              <ChevronDown className="w-3 h-3 text-gray-600" />
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">Mapping Summary</p>
            <p className="text-gray-600">
              {mappings.filter(m => m.isMapped).length} of {fileColumns.length} file columns mapped
            </p>
            <p className="text-gray-500 mt-1">
              Unmapped columns will be ignored during import
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMapping;

