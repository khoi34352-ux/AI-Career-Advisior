
import React, { useMemo } from 'react';
import type { MindMap, MindMapBranch } from '../types';

const THEME_COLORS = [
    { stroke: 'stroke-violet-500 dark:stroke-violet-400', fill: 'fill-violet-500 dark:fill-violet-400', text: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-900/50' },
    { stroke: 'stroke-pink-500 dark:stroke-pink-400', fill: 'fill-pink-500 dark:fill-pink-400', text: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-50 dark:bg-pink-900/50' },
    { stroke: 'stroke-emerald-500 dark:stroke-emerald-400', fill: 'fill-emerald-500 dark:fill-emerald-400', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-900/50' },
    { stroke: 'stroke-amber-500 dark:stroke-amber-400', fill: 'fill-amber-500 dark:fill-amber-400', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/50' },
    { stroke: 'stroke-sky-500 dark:stroke-sky-400', fill: 'fill-sky-500 dark:fill-sky-400', text: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-900/50' },
];

const FONT_SIZES = { item: 12, branch: 14, center: 15 };
const DIMS = {
    width: 950,
    height: 800,
    centerX: 140,
    centerRadius: 80,
    branchX: 360,
    itemsX: 0, // Calculated below
    branchTextWidth: 160,
    itemTextPadding: 10,
    itemVSpace: 45,
    branchVSpace: 60,
    branchNodeHeight: 70,
};
DIMS.itemsX = DIMS.branchX + DIMS.branchTextWidth / 2 + 40;


const WrappedText: React.FC<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    className?: string;
    isNode?: boolean;
}> = ({ text, x, y, width, height, fontSize, className = '', isNode = false }) => (
    <foreignObject x={x} y={y - height / 2} width={width} height={height} >
      <div 
        className={`w-full h-full flex items-center box-border ${className}`}
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.4 }}
      >
        <p className={isNode ? 'text-center w-full' : 'w-full'}>{text}</p>
      </div>
    </foreignObject>
);


interface LayoutData {
    branchY: number;
    itemYs: number[];
}

const calculateLayout = (branches: MindMapBranch[]): [LayoutData[], number] => {
    if (!branches) return [[], DIMS.height];

    const branchLayouts: LayoutData[] = [];
    
    const clusterHeights = branches.map(branch => (branch.items?.length || 0) * DIMS.itemVSpace + DIMS.branchNodeHeight);
    const totalContentHeight = clusterHeights.reduce((sum, h) => sum + h, 0) + Math.max(0, branches.length - 1) * DIMS.branchVSpace;
    const dynamicHeight = Math.max(DIMS.height, totalContentHeight + 100);
    const centerY = dynamicHeight / 2;
    
    let currentY = centerY - totalContentHeight / 2;

    for (let i = 0; i < branches.length; i++) {
        const branch = branches[i];
        const clusterHeight = clusterHeights[i];
        const branchY = currentY + clusterHeight / 2;
        
        const totalItemsHeight = (branch.items?.length || 0) * DIMS.itemVSpace;
        const itemStartY = branchY - totalItemsHeight / 2 + DIMS.itemVSpace / 2;
        
        const itemYs = (branch.items || []).map((_, j) => itemStartY + j * DIMS.itemVSpace);

        branchLayouts.push({ branchY, itemYs });
        currentY += clusterHeight + DIMS.branchVSpace;
    }
    
    return [branchLayouts, dynamicHeight];
};

const MindMapDisplay: React.FC<{ mindmap: MindMap }> = ({ mindmap }) => {

    const [layout, dynamicHeight] = useMemo(() => calculateLayout(mindmap.branches || []), [mindmap.branches]);
    const centerY = dynamicHeight / 2;

    const itemTextMaxWidth = DIMS.width - DIMS.itemsX - DIMS.itemTextPadding * 2;

    return (
        <div className="w-full flex justify-center text-xs sm:text-sm">
            <svg viewBox={`0 0 ${DIMS.width} ${dynamicHeight}`} preserveAspectRatio="xMidYMid meet" style={{ fontFamily: 'system-ui, sans-serif' }}>

                {/* Center Node */}
                <g>
                    <circle cx={DIMS.centerX} cy={centerY} r={DIMS.centerRadius} strokeWidth="3" className="fill-amber-50 dark:fill-amber-500/20 stroke-amber-500 dark:stroke-amber-400" />
                    <WrappedText
                        text={mindmap.center}
                        x={DIMS.centerX - (DIMS.centerRadius - 15)}
                        y={centerY}
                        width={(DIMS.centerRadius - 15) * 2}
                        height={(DIMS.centerRadius - 15) * 2}
                        fontSize={FONT_SIZES.center}
                        className="font-bold text-amber-800 dark:text-amber-100 justify-center p-2"
                        isNode
                    />
                </g>
                
                {(mindmap.branches || []).map((branch, index) => {
                    if (!branch || !layout[index]) return null;

                    const theme = THEME_COLORS[index % THEME_COLORS.length];
                    const { branchY, itemYs } = layout[index];
                    
                    const angle = Math.atan2(branchY - centerY, DIMS.branchX - DIMS.centerX);
                    const startX = DIMS.centerX + DIMS.centerRadius * Math.cos(angle);
                    const startY = centerY + DIMS.centerRadius * Math.sin(angle);
                    
                    const pathCenterToBranch = `M ${startX},${startY} C ${startX + 80},${startY} ${DIMS.branchX - 100},${branchY} ${DIMS.branchX - DIMS.branchTextWidth/2},${branchY}`;

                    return (
                        <g key={branch.title}>
                            {/* Main Branch Path & Node */}
                            <path d={pathCenterToBranch} className={theme.stroke} strokeWidth="2.5" fill="none" />
                            <WrappedText
                                text={branch.title}
                                x={DIMS.branchX - DIMS.branchTextWidth / 2}
                                y={branchY}
                                width={DIMS.branchTextWidth}
                                height={DIMS.branchNodeHeight}
                                fontSize={FONT_SIZES.branch}
                                className={`font-bold rounded-lg p-2 justify-center border dark:border-slate-600 ${theme.text} ${theme.bg}`}
                                isNode
                            />

                            {/* Item Paths & Nodes */}
                            {(branch.items || []).map((item, j) => {
                                if (!item || !itemYs[j]) return null;
                                const itemY = itemYs[j];
                                const pathBranchToItem = `M ${DIMS.branchX + DIMS.branchTextWidth/2},${branchY} C ${DIMS.branchX + DIMS.branchTextWidth/2 + 50},${branchY} ${DIMS.itemsX - 50},${itemY} ${DIMS.itemsX},${itemY}`;
                                
                                return (
                                    <g key={item}>
                                        <path d={pathBranchToItem} className={`${theme.stroke} opacity-70`} strokeWidth="1.5" fill="none" />
                                        <circle cx={DIMS.itemsX} cy={itemY} r="4" className={theme.fill} />
                                        <WrappedText
                                            text={item}
                                            x={DIMS.itemsX + DIMS.itemTextPadding}
                                            y={itemY}
                                            width={itemTextMaxWidth}
                                            height={DIMS.itemVSpace * 1.5}
                                            className="text-gray-700 dark:text-gray-300 justify-start"
                                            fontSize={FONT_SIZES.item}
                                        />
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default MindMapDisplay;