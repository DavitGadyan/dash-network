import * as d3 from 'd3';

const DRAGALPHA = 0.3; 
const DIST_MULTIPLIER = 1; 
const DIST_EXTRA = 0; 
const REPULSION = -500; 
const REPULSIONPOWER = 0.7; 
const MAXREPULSIONLENGTH = 0.25; 
const ZOOM_SCALE_EXTENT_MIN = 1; 
const ZOOM_SCALE_EXTENT_MAX = 5;
const VELOCITY_DECAY = 0.8;
const PADDING = 8;
const PREFIX_ID = 'network';

const dflts = {
    width: 500,
    height: 500,
    linkWidth: 4,
    maxLinkWidth: 20,
    nodeRadius: 10,
    maxRadius: 20
};

const linkAttrs = {
    stroke: '#999',
    strokeOpacity: 0.6,
    strokeWidth: 2
};

const nodeAttrs = {
    stroke: '#fff',
    strokeWidth: 1
};

export default class NetworkD3 {
    constructor(el, figure, onClick) {
        const self = this;
        self.el = el;

        self.update = self.update.bind(self);
        self.tick = self.tick.bind(self);
        self.drag = self.drag.bind(self);
        self.wrappedClick = self.wrappedClick.bind(self);
        self.zoomed = self.zoomed.bind(self);

        // eslint-disable-next-line no-use-before-define
        self.colorSchemeFactory = new ColorSchemeFactory();
        self.colorScheme = self.colorSchemeFactory.getColorScheme(figure.data.colorscheme);
        self.color = d => self.colorScheme(d.color);

        self.svg = d3.select(el).append('svg');
        self.svg.on('click', self.wrappedClick);
        
        self.defs = self.svg.append("svg:defs");

        self.linkGroup = self.svg.append('g')
            .style('pointer-events', 'none');
        self.nodeGroup = self.svg.append('g');
        self.textGroup = self.svg.append('g')
            .style('pointer-events', 'none');

        self.figure = {};

        self.onClick = onClick;

        self.initialized = false;

        self.nodeData = [];
        self.linkData = [];

        self.repulsion = d3.forceManyBody();
        self.simulation = d3.forceSimulation(self.nodeData)
            .force('charge', self.repulsion)
            .force('center', d3.forceCenter())
            .velocityDecay(VELOCITY_DECAY)
            .on('tick', self.tick());

        self.zoom = d3.zoom()
            .scaleExtent([ZOOM_SCALE_EXTENT_MIN, ZOOM_SCALE_EXTENT_MAX])
            .on("zoom", self.zoomed);

        self.svg
            .call(self.zoom)
            .call(self.zoom.transform, d3.zoomIdentity);

        self.update(figure);
    }

    wrappedClick(d) {
        this.onClick(d);
        this.resetZoom();
        d3.event.stopPropagation();
    }

    update(figure) {
        const self = this;
        const oldFigure = self.figure;

        // fill defaults in the new figure
        const width = figure.width || self.el.offsetWidth;
        const height = figure.height || dflts.height;
        const linkWidth = figure.linkWidth || dflts.linkWidth;
        const maxLinkWidth = figure.maxLinkWidth || dflts.maxLinkWidth;
        const nodeRadius = figure.nodeRadius || dflts.nodeRadius;
        const maxRadius = figure.maxRadius || dflts.maxRadius;
        const {data, dataVersion} = figure;

        const newFigure = self.figure = {
            width,
            height,
            linkWidth,
            maxLinkWidth,
            nodeRadius,
            maxRadius,
            data,
            dataVersion
        };

        const change = diff(oldFigure, newFigure);
        if(!change) { return; }

        const sizeChange = change.width || change.height;
        const dataChange = change.data;
        const linkWidthChange = change.linkWidth || change.maxLinkWidth;
        const radiusChange = change.nodeRadius;

        if(sizeChange) {
            self.svg
                .attr('viewBox', [-width / 2, -height / 2, width, height])
                .attr('width', width)
                .attr('height', height);

            self.repulsion.distanceMax(Math.min(width, height) * MAXREPULSIONLENGTH);

            const zoomExtent = [[0, 0], [width, height]];
            self.zoom
                .extent(zoomExtent)
                .translateExtent(zoomExtent);
        }

        let links = self.linkGroup.selectAll('line');
        let nodes = self.nodeGroup.selectAll('circle');
        let i;

        if(dataChange) {
            // Update nodes with new data.
            // The force simulation is connected to the self.nodeData array
            // and it adds other attributes to the array, so update this array in place
            const nodeMap = {};
            const newIDs = {};
            for(i in self.nodeData) {
                nodeMap[self.nodeData[i].id] = self.nodeData[i];
            }
            for(i in data.nodes) {
                const newNode = data.nodes[i];
                newIDs[newNode.id] = 1;
                const existingNode = nodeMap[newNode.id];
                if(existingNode) {
                    existingNode.radius = newNode.radius;
                    existingNode.color = newNode.color;
                }
                else {
                    self.nodeData.push(newNode);
                    nodeMap[newNode.id] = newNode;
                }
            }
            for(i = self.nodeData.length - 1; i >= 0; i--) {
                const oldId = self.nodeData[i].id;
                if(!newIDs[oldId]) {
                    self.nodeData.splice(i, 1);
                    delete nodeMap[oldId];
                }
            }

            self.colorScheme = self.colorSchemeFactory.getColorScheme(self.figure.data.colorscheme);

            self.simulation.nodes(self.nodeData);

            // Update links in place as well
            // Links array has no extra data so we can simply replace old with new
            // but convert ids to node references
            for(i in data.links) {
                const linkDatai = data.links[i];
                self.linkData[i] = {
                    source: nodeMap[linkDatai.source],
                    target: nodeMap[linkDatai.target],
                    index: i
                };
            }
            const oldLinkCount = self.linkData.length;
            const newLinkCount = data.links.length;
            if(oldLinkCount > newLinkCount) {
                self.linkData.splice(newLinkCount, oldLinkCount - newLinkCount);
            }

            // Update defs
            self.updateDefs();

            // Now propagate the new data (& attributes) to the DOM elements
            // Omit positioning for now, it will be handled by `self.tick`
            // via the force model.
            links = links.data(self.linkData, d => d.source + '>>' + d.source);
            links.exit().remove();
            links = links.enter().append('line')
              .merge(links)
                .attr("stroke", d => `url(#${self.createConnectId(d.source, d.target)})`)
                .attr("stroke-width", linkAttrs.strokeWidth);

            nodes = nodes.data(self.nodeData, d => d.id);
            nodes.exit().remove();
            nodes = nodes.enter().append('circle')
                .call(self.drag())
                .on('click', self.wrappedClick)
              .merge(nodes)
                .attr('stroke-width', nodeAttrs.strokeWidth)
                .attr('fill', d => `url(#${PREFIX_ID + normalizeId(d.id)})`);
        }

        self.links = links;
        self.nodes = nodes;

        if(dataChange || linkWidthChange) {
            let maxFoundWidth = 0;
            self.links.each(d => {
                maxFoundWidth = Math.max(maxFoundWidth, d.width || 0);
            });
            maxFoundWidth = maxFoundWidth || 1;
            self.links.attr('width', d => (d.width * maxLinkWidth / maxFoundWidth) || linkWidth);
        }

        if(dataChange || radiusChange) {
            let maxFoundRadius = 0;
            self.nodes.each(d => {
                maxFoundRadius = Math.max(maxFoundRadius, d.radius || 0);
            });
            maxFoundRadius = maxFoundRadius || 1;
            self.nodes.each(d => {
                d._r = (d.radius * maxRadius / maxFoundRadius) || nodeRadius;
            })
            self.nodes.attr('r', d => d._r);

            self.simulation.force('link', d3.forceLink(self.linkData).distance(link => {
                return DIST_MULTIPLIER * (link.source._r + link.target._r) + DIST_EXTRA
            }));
            self.repulsion.strength(d => (
                REPULSION * d._r / Math.pow(self.nodeData.length, REPULSIONPOWER)
            ));
        }
        self.simulation.alpha(0.5).restart();
    }

    updateDefs() {
        /**
         * Update linear gradients for lines
         */
        const linearGradients = this.defs.selectAll("linearGradient").data(this.linkData);
        const enterLinearGradients = linearGradients.enter().append("linearGradient");

        enterLinearGradients.append("svg:stop")
            .attr("class", "stop--first")
            .attr("offset", "0%");
        enterLinearGradients.append("svg:stop")
            .attr("class", "stop--second")
            .attr("offset", "100%");

        const mergeLinearGradients = enterLinearGradients.merge(linearGradients);

        mergeLinearGradients
            .attr("id", d => this.createConnectId(d.source, d.target))
            .attr("spreadMethod", "pad");
        mergeLinearGradients.select('stop.stop--first')
            .attr("stop-color", d => this.color(d.source));
        mergeLinearGradients.select('stop.stop--second')
            .attr("stop-color", d => this.color(d.target));

        linearGradients.exit().remove();

        /**
         * Update radial gradients
         * They provide slight glow on nodes
         */
        const radialGradients = this.defs.selectAll("radialGradient").data(this.nodeData);
        const enterRadialGradients = radialGradients.enter().append("radialGradient");

        enterRadialGradients.append("svg:stop")
            .attr("class", "stop--first")
            .attr("offset", "40%")
            .attr("stop-opacity", "1");
        enterRadialGradients.append("svg:stop")
            .attr("class", "stop--second")
            .attr("offset", "60%")
            .attr("stop-opacity", "0");

        const mergeRadialGradients = enterRadialGradients.merge(radialGradients);
        
        mergeRadialGradients
            .attr("id", d => PREFIX_ID + normalizeId(d.id));
        mergeRadialGradients.select("stop.stop--first")
            .attr("stop-color", d => this.color(d))
        mergeRadialGradients.select("stop.stop--second")
            .attr("stop-color", d => this.color(d));

        radialGradients.exit().remove();
    }

    tick() {
        const self = this;
        return () => {
            self.nodes
                .attr("cx", d => {
                    const cx = self.getClientBoundingX(d.x);
                    d.x = cx;
                    return cx;
                })
                .attr("cy", d => {
                    const cy = self.getClientBoundingY(d.y);
                    d.y = cy;
                    return cy;
                });

            self.links
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            self.defs.selectAll("linearGradient").each(function(d) {
                const {source, target} = d;
                // eslint-disable-next-line no-use-before-define
                const linkVector = new Vector(target.x - source.x, target.y - source.y).getUnit();
                const ratio = 0.5;
                const gradientVector = linkVector.scale(ratio);

                self.defs.select('#' + self.createConnectId(d.source, d.target))
                    .attr("x1", ratio - gradientVector.x)
                    .attr("y1", ratio - gradientVector.y)
                    .attr("x2", ratio + gradientVector.x)
                    .attr("y2", ratio + gradientVector.y);
            });
        }
    }

    getClientBoundingX(x) {
        const {width, nodeRadius} = this.figure;
        const halfWidth = width / 2;
        const maxHalfWidth = halfWidth - nodeRadius;
        
        if (x < -maxHalfWidth) {
            return -maxHalfWidth + PADDING;
        }

        if (x > maxHalfWidth) {
            return maxHalfWidth - PADDING;
        }

        return x;
    }

    getClientBoundingY(y) {
        const {height, nodeRadius} = this.figure;
        const halfHeight = height / 2;
        const maxHalfHeight = halfHeight - nodeRadius;

        if (y < -maxHalfHeight) {
            return -maxHalfHeight + PADDING;
        }

        if (y > maxHalfHeight) {
            return maxHalfHeight - PADDING;
        }

        return y;
    }

    drag() {
        const self = this;

        const dragstarted = d => {
            if (!d3.event.active) {
                self.simulation.alphaTarget(DRAGALPHA).restart();
            }
            d.fx = d.x;
            d.fy = d.y;
        }

        const dragged = d => {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        const dragended = d => {
            if (!d3.event.active) {
                self.simulation.alphaTarget(0);
            }
            d.fx = null;
            d.fy = null;
        }

        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    zoomed() {
        this.nodeGroup.attr("transform", d3.event.transform);
        this.linkGroup.attr("transform", d3.event.transform);
    }

    resetZoom() {
        this.svg.call(this.zoom.transform, d3.zoomIdentity);
    }

    createConnectId(source, target) {
        const sourceId = source.id;
        const targetId = target.id;
        
        return PREFIX_ID + normalizeId(sourceId) + "_" + normalizeId(targetId);
    }
};

/**
 * Very simple diff - assumes newObj is flat and has all the possible keys from oldObj
 * uses a "dataVersion" key to avoid diffing the full data object.
 * In fact, this way we can avoid copying data (ie treating it immutably),
 * and just use dataVersion to track mutations.
 */
function diff(oldObj, newObj) {
    const V = 'Version';
    const out = {};
    let hasChange = false;
    for(const key in newObj) {
        if(key.substr(key.length - V.length) === V) { continue; }

        if(typeof newObj[key] === 'object') {
            if(newObj[key + V]) {
                if(newObj[key + V] !== oldObj[key + V]) {
                    out[key] = 1;
                    hasChange = true;
                }
            }
            else if(JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
                out[key] = 1;
                hasChange = true;
            }
        }
        else if(oldObj[key] !== newObj[key]) {
            out[key] = 1;
            hasChange = true;
        }
    }
    return hasChange && out;
}

/**
 * Create a valid id by escaping a string
 * @param {string} str 
 */
function normalizeId(str) {
    return str.replace(/\W/g, "_");
}

/**
 * Define a vector and magnitude
 * @constructor x, y
 */
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.magnitude = Math.sqrt(x * x, y * y);
    }

    getUnit() {
        return new Vector(this.x / this.magnitude, this.y / this.magnitude);
    }

    scale(ratio) {
        return new Vector(this.x * ratio, this.y * ratio);
    }
}

class ColorSchemeFactory {
    constructor() {
        this._customColorsScheme = this._createCustomColorsScheme();
    }

    getColorScheme(colorSchemeName) {
        let colorScheme = this.getCustomColorScheme(colorSchemeName) || this.getInterpolateColor(colorSchemeName);

        if (!colorScheme) {
            colorScheme = this.getDefaultScheme();
        }

        return colorScheme;
    }

    getInterpolateColor(colorSchemeName) {
        return d3[`interpolate${colorSchemeName}`];
    }

    getCustomColorScheme(colorSchemeName) {
        return this._customColorsScheme[colorSchemeName];
    }

    getDefaultScheme() {
        return d3.interpolateReds;
    }

    _createCustomColorsScheme() {
        const Bluered = this._createLinearColorScale([
            'rgb(0, 0, 255)', 
            'rgb(255, 0, 0)'
        ]);
        const Rainbow = this._createDivergingColorScale([
            'rgb(150,0,90)', 
            'rgb(0,0,200)',
            'rgb(0,25,255)', 
            'rgb(0,152,255)',
            'rgb(44,255,150)', 
            'rgb(151,255,0)',
            'rgb(255,234,0)', 
            'rgb(255,111,0)',
            'rgb(255,0,0)',
        ]);
        const Picnic = this._createDivergingColorScale([
            'rgb(0,0,255)', 
            'rgb(51,153,255)', 
            'rgb(102,204,255)', 
            'rgb(153,204,255)', 
            'rgb(204,204,255)', 
            'rgb(255,255,255)', 
            'rgb(255,204,255)', 
            'rgb(255,153,255)', 
            'rgb(255,102,204)', 
            'rgb(255,102,102)', 
            'rgb(255,0,0)'
        ]);
        const Portland = this._createDivergingColorScale([
            'rgb(12,51,131)', 
            'rgb(10,136,186)', 
            'rgb(242,211,56)', 
            'rgb(242,143,56)', 
            'rgb(217,30,30)'
        ]);
        const Jet = this._createDivergingColorScale([
            'rgb(0,0,131)', 
            'rgb(0,60,170)', 
            'rgb(5,255,255)', 
            'rgb(255,255,0)',
            'rgb(250,0,0)',
            'rgb(128,0,0)',
        ]);
        const Hot = this._createDivergingColorScale([
            'rgb(0,0,0)', 
            'rgb(230,0,0)', 
            'rgb(255,210,0)', 
            'rgb(255,255,255)'
        ]);
        const Blackbody = this._createDivergingColorScale([
            'rgb(0,0,0)', 
            'rgb(230,0,0)', 
            'rgb(230,210,0)', 
            'rgb(255,255,255)', 
            'rgb(160,200,255)'
        ]);
        const Earth = this._createDivergingColorScale([
            'rgb(161, 105, 40)', 
            'rgb(189, 146, 90)', 
            'rgb(214, 189, 141)', 
            'rgb(237, 234, 194)', 
            'rgb(181, 200, 184)', 
            'rgb(121, 167, 172)', 
            'rgb(40, 135, 161)'
        ]);
        const Electric = this._createDivergingColorScale([
            'rgb(0,0,0)', 
            'rgb(30,0,100)', 
            'rgb(120,0,100)', 
            'rgb(160,90,0)', 
            'rgb(230,200,0)', 
            'rgb(255,250,220)'
        ]);

        return {
            Bluered,
            Picnic,
            Portland,
            Jet,
            Hot,
            Blackbody,
            Earth,
            Electric,
            Rainbow
        }
    }
    
    _createLinearColorScale(colorArray) {
        return d3.interpolateRgbBasis(colorArray);
    }

    _createDivergingColorScale(colorArray) {
        const length = colorArray.length;
        const step = 1 / (length - 1);
        const defaultColor = colorArray[length - 1];

        return d3.scaleSequential((value) => {
            const index = Math.round(value / step);
            const color = colorArray[index] || defaultColor;
            return color;
        });
    }
}