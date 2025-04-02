import React, { useEffect, useState, useRef } from 'react';
// Dynamic import for ForceGraph2D - will only be imported on client side
import { GraphNode, GraphLink } from '../types';
import { useWOT } from '../context/WOTContext';

// Add ForceGraph node type definition
interface ForceGraphNode extends GraphNode {
  x?: number;
  y?: number;
  color?: string;
}

// Fixed height for graph
const GRAPH_HEIGHT = 400;

const SocialGraph: React.FC = () => {
  const { wot, getTrustScore, isLoading, dataInitialized } = useWOT();
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: []
  });
  const [isClient, setIsClient] = useState(false);
  const [ForceGraph, setForceGraph] = useState<any>(null);
  
  const graphRef = useRef<any>(null);

  // Check if we're running on client-side and import ForceGraph2D
  useEffect(() => {
    setIsClient(true);
    
    // Import ForceGraph2D dynamically only on client
    import('react-force-graph').then(module => {
      setForceGraph(module.ForceGraph2D);
    }).catch(err => {
      console.error('Error loading ForceGraph:', err);
    });
  }, []);
  
  // Update graph data when profiles change
  useEffect(() => {
    // Don't update if still loading the network
    if (isLoading || !isClient) return;
    
    try {
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      const pubkeys = Object.keys(wot.profiles);
      
      // Create nodes first
      pubkeys.forEach(pubkey => {
        const profile = wot.profiles[pubkey];
        const trustScore = getTrustScore(pubkey);
        
        nodes.push({
          id: pubkey,
          name: profile.displayName || profile.name || pubkey.slice(0, 8),
          val: 1 + (trustScore * 3), // Size based on trust score
          img: profile.picture,
          trustScore
        });
      });
      
      // Then create links
      pubkeys.forEach(pubkey => {
        const profile = wot.profiles[pubkey];
        
        if (profile.following) {
          profile.following.forEach(target => {
            // Only create link if target is also in our network
            if (wot.profiles[target]) {
              links.push({
                source: pubkey,
                target,
                value: 1
              });
            }
          });
        }
      });
      
      setGraphData({ nodes, links });
    } catch (err) {
      console.error('Error updating graph data:', err);
    }
  }, [wot.profiles, isLoading, getTrustScore, isClient, dataInitialized]);
  
  // Center the graph on render and resize
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0 && isClient && graphRef.current.zoomToFit) {
      // Center after small delay for rendering
      setTimeout(() => {
        try {
          graphRef.current.zoomToFit(400, 30);
        } catch (err) {
          console.error('Error zooming graph:', err);
        }
      }, 300);
    }
  }, [graphData.nodes.length, isClient]);
  
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-2">Madeira Social Graph</h2>
      <div className="w-full h-[400px] bg-white dark:bg-gray-800 rounded-lg shadow">
        {isLoading || !isClient || !ForceGraph ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-blue-600">Building social graph...</div>
          </div>
        ) : (
          ForceGraph && (
            <ForceGraph
              ref={graphRef}
              graphData={graphData}
              height={GRAPH_HEIGHT}
              width={undefined} // Auto-width
              nodeLabel={node => `${(node as GraphNode).name}`}
              nodeColor={node => {
                const trustScore = (node as GraphNode).trustScore || 0;
                // Color by trust: yellow (seed) to blue (less trusted)
                if (trustScore >= 0.9) return "#FFC800"; // Madeira yellow
                if (trustScore >= 0.6) return "#83A9D3";
                if (trustScore >= 0.3) return "#4F85C3";
                return "#0063B2"; // Madeira blue
              }}
              linkColor={() => "#cccccc"}
              linkWidth={1}
              cooldownTicks={100}
              nodeRelSize={6}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const graphNode = node as ForceGraphNode;
                const size = graphNode.val || 3;
                const fontSize = 8;
                
                // Only draw if we have position
                if (graphNode.x === undefined || graphNode.y === undefined) return;
                
                // Draw node circle
                ctx.beginPath();
                ctx.arc(graphNode.x, graphNode.y, size, 0, 2 * Math.PI);
                ctx.fillStyle = graphNode.color || '#1f77b4';
                ctx.fill();
                
                // Draw label if zoomed in enough
                if (globalScale > 1) {
                  const label = graphNode.name || "";
                  
                  ctx.font = `${fontSize}px Sans-Serif`;
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillStyle = "#ffffff";
                  ctx.fillText(label, graphNode.x, graphNode.y + size + fontSize);
                }
              }}
            />
          )
        )}
      </div>
    </div>
  );
};

export default SocialGraph; 