import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ReactFlow, Controls, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const FlowVisualizer = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [config, setConfig] = useState({
    flow: 'flow name',
    entities_to_mock: [],
    is_db_mocked: false,
    db_config: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    // Fetch graph data
    axios.get('/graph')
      .then((response) => {
        console.log('Graph Data:', response.data);
        const graphData = response.data;
        const { nodes: graphNodes, edges: graphEdges } = convertGraphToElements(graphData);
        setNodes(graphNodes);
        setEdges(graphEdges);
      })
      .catch((error) => {
        console.error('Error fetching graph data:', error);
      });

    // Fetch dependencies
    axios.get('/dependencies?flow=name')
      .then((response) => {
        console.log('Dependencies:', response.data);
        const data = response.data;
        if (Array.isArray(data)) {
          setDependencies(data);
        } else {
          console.error('Invalid dependencies format. Expected an array.');
          setDependencies([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching dependencies:', error);
      });

    // Fetch existing configuration
    axios.get('/configuration?flow=flow_name')
      .then((response) => {
        console.log('Configuration:', response.data);
        setConfig(response.data);
      })
      .catch((error) => {
        console.error('Error fetching configuration:', error);
      });
  }, []);

  const convertGraphToElements = (graphData) => {
    const nodes = [];
    const edges = [];
    let x = 0;
    let y = 0;

    if (!Array.isArray(graphData)) {
      console.error('Invalid graph data format. Expected an array.');
      return { nodes, edges };
    }

    const processNode = (node, parentId = null) => {
      const nodeId = node.function;
      nodes.push({
        id: nodeId,
        data: { label: node.function },
        position: { x, y },
      });

      if (parentId) {
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
        });
      }

      x += 200; // Adjust spacing
      y += 100;

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => processNode(child, nodeId));
      }
    };

    graphData.forEach((node) => processNode(node));
    return { nodes, edges };
  };

  const handleSave = () => {
    axios.post('/configuration', config)
      .then((response) => {
        alert('Configuration saved successfully!');
      })
      .catch((error) => {
        console.error('Error saving configuration:', error);
      });
  };

  const handleToggleDependency = (dependency) => {
    setConfig((prevConfig) => {
      const updatedEntities = prevConfig.entities_to_mock.includes(dependency)
        ? prevConfig.entities_to_mock.filter((dep) => dep !== dependency)
        : [...prevConfig.entities_to_mock, dependency];
      return { ...prevConfig, entities_to_mock: updatedEntities };
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Graph Visualization */}
      <div style={{ flex: 3, borderRight: '1px solid #ddd' }}>
        <ReactFlow nodes={nodes} edges={edges}>
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Dependencies Panel */}
      <div style={{ flex: 1, padding: '16px' }}>
        <h3>Dependencies</h3>
        {dependencies && Array.isArray(dependencies) ? (
          dependencies.map((dependency) => (
            <div key={dependency} style={{ marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={config.entities_to_mock.includes(dependency)}
                onChange={() => handleToggleDependency(dependency)}
              />
              <label>{dependency}</label>
            </div>
          ))
        ) : (
          <p>No dependencies found.</p>
        )}

        {/* Database Mocking Toggle */}
        <div style={{ marginTop: '16px' }}>
          <label>
            <input
              type="checkbox"
              checked={config.is_db_mocked}
              onChange={(e) =>
                setConfig((prevConfig) => ({
                  ...prevConfig,
                  is_db_mocked: e.target.checked,
                }))
              }
            />
            I want to mock the database
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default FlowVisualizer;