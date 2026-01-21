import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BarChart3, GitBranch, Database, FileText, Play } from 'lucide-react';
import Flowchart from './Flowchart';
import DataFlow from './DataFlow';
import MemoryLayout from './MemoryLayout';
import DivisionStructure from './DivisionStructure';
import ExecutionAnimation from './ExecutionAnimation';

const VisualizationPanel = ({ code, isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState('flowchart');
  const [isLoading, setIsLoading] = useState(false);
  const [flowchart, setFlowchart] = useState(null);
  const [dataflow, setDataflow] = useState(null);
  const [memoryLayout, setMemoryLayout] = useState(null);
  const [divisionStructure, setDivisionStructure] = useState(null);
  const [executionTrace, setExecutionTrace] = useState(null);

  const tabs = [
    { id: 'flowchart', name: 'Flowchart', icon: GitBranch },
    { id: 'dataflow', name: 'Data Flow', icon: BarChart3 },
    { id: 'memory', name: 'Memory Layout', icon: Database },
    { id: 'structure', name: 'Division Structure', icon: FileText },
    { id: 'execution', name: 'Execution Trace', icon: Play }
  ];

  // Load visualizations when code changes
  useEffect(() => {
    if (code && isVisible) {
      loadVisualizations();
    }
  }, [code, isVisible]);

  const loadVisualizations = async () => {
    setIsLoading(true);
    
    try {
      // Load flowchart
      const flowchartResponse = await fetch('http://localhost:5000/api/visualization/flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (flowchartResponse.ok) {
        const flowchartData = await flowchartResponse.json();
        if (flowchartData.success) {
          setFlowchart(flowchartData.flowchart);
        }
      }
      
      // Load data flow
      const dataflowResponse = await fetch('http://localhost:5000/api/visualization/dataflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (dataflowResponse.ok) {
        const dataflowData = await dataflowResponse.json();
        if (dataflowData.success) {
          setDataflow(dataflowData.dataflow);
        }
      }
      
      // Load memory layout
      const memoryResponse = await fetch('http://localhost:5000/api/visualization/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (memoryResponse.ok) {
        const memoryData = await memoryResponse.json();
        if (memoryData.success) {
          setMemoryLayout(memoryData.memoryLayout);
        }
      }
      
      // Load division structure
      const structureResponse = await fetch('http://localhost:5000/api/visualization/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (structureResponse.ok) {
        const structureData = await structureResponse.json();
        if (structureData.success) {
          setDivisionStructure(structureData.structure);
        }
      }
      
      // Load execution trace
      const traceResponse = await fetch('http://localhost:5000/api/visualization/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      if (traceResponse.ok) {
        const traceData = await traceResponse.json();
        if (traceData.success) {
          setExecutionTrace(traceData.trace);
        }
      }
    } catch (error) {
      console.error('Error loading visualizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">Program Visualization</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-gray-600">Generating visualization...</span>
          </div>
        ) : (
          <>
            {activeTab === 'flowchart' && <Flowchart data={flowchart} />}
            {activeTab === 'dataflow' && <DataFlow data={dataflow} />}
            {activeTab === 'memory' && <MemoryLayout data={memoryLayout} />}
            {activeTab === 'structure' && <DivisionStructure data={divisionStructure} />}
            {activeTab === 'execution' && <ExecutionAnimation data={executionTrace} />}
          </>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;
