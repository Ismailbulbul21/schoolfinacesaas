import React from 'react';
import { Check } from 'lucide-react';

export interface ColumnOption {
  id: string;
  name: string;
  displayName: string;
  type: string;
  category: string;
}

interface ColumnSelectionProps {
  selectedColumns: string[];
  onColumnToggle: (columnId: string) => void;
  availableColumns: ColumnOption[];
}

const COLUMN_OPTIONS: ColumnOption[] = [
  { id: 'name', name: 'name', displayName: 'Full Name', type: 'text', category: 'essential' },
  { id: 'class_name', name: 'class_name', displayName: 'Class/Grade', type: 'text', category: 'essential' },
  { id: 'email', name: 'email', displayName: 'Email', type: 'email', category: 'contact' },
  { id: 'phone', name: 'phone', displayName: 'Phone Number', type: 'phone', category: 'contact' },
  { id: 'parent_name', name: 'parent_name', displayName: 'Parent Names', type: 'text', category: 'contact' },
  { id: 'student_id', name: 'student_id', displayName: 'Student ID', type: 'text', category: 'essential' },
  { id: 'date_of_birth', name: 'date_of_birth', displayName: 'Date of Birth', type: 'date', category: 'personal' },
  { id: 'gender', name: 'gender', displayName: 'Gender', type: 'text', category: 'personal' }
];

const ColumnSelection: React.FC<ColumnSelectionProps> = ({
  selectedColumns,
  onColumnToggle,
  availableColumns
}) => {
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'essential': return 'Essential Information';
      case 'contact': return 'Contact Information';
      case 'personal': return 'Personal Information';
      default: return 'Other';
    }
  };

  const groupedColumns = COLUMN_OPTIONS.reduce((acc, column) => {
    if (!acc[column.category]) {
      acc[column.category] = [];
    }
    acc[column.category].push(column);
    return acc;
  }, {} as Record<string, ColumnOption[]>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose Columns to Import
        </h3>
        <p className="text-sm text-gray-600">
          Select which student information you want to import from your file
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedColumns).map(([category, columns]) => (
          <div key={category} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              {getCategoryName(category)}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {columns.map((column) => {
                const isSelected = selectedColumns.includes(column.id);
                const isAvailable = availableColumns.some(col => 
                  col.name.toLowerCase().replace(/[^a-z0-9]/g, '_') === column.id ||
                  col.name.toLowerCase().includes(column.name.toLowerCase()) ||
                  column.name.toLowerCase().includes(col.name.toLowerCase())
                );
                
                return (
                  <div
                    key={column.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onColumnToggle(column.id)}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{column.displayName}</div>
                      <div className="text-xs text-gray-500 capitalize">
                        {column.type} field
                      </div>
                    </div>
                    {!isAvailable && (
                      <div className="text-xs text-gray-400">
                        Not in file
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-blue-600" />
            </div>
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-900">Selected Columns</p>
            <p className="text-blue-700">
              {selectedColumns.length} of {COLUMN_OPTIONS.length} columns selected
            </p>
            {selectedColumns.length > 0 && (
              <p className="text-blue-600 mt-1">
                {selectedColumns.map(id => 
                  COLUMN_OPTIONS.find(col => col.id === id)?.displayName
                ).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnSelection;
