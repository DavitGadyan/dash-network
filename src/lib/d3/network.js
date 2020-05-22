import * as d3 from 'd3';

const DRAGALPHA = 0.3;
const DIST_MULTIPLIER = 1;
const DIST_EXTRA = 0;
const REPULSION = -80;
const REPULSIONPOWER = 0.3;
const MAXREPULSIONLENGTH = 0.25;
const ZOOM_SCALE_EXTENT_MIN = 1;
const ZOOM_SCALE_EXTENT_MAX = 5;
const VELOCITY_DECAY = 0.8;
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

// const textStyle = {
//     fill: '#444',
//     textAnchor: 'middle',
//     fontSize: '10px',
//     fontFamily: 'Arial',
//     textShadow: 'white -1px 0px 0.5px, white 0px -1px 0.5px, white 0px 1px 0.5px, white 1px 0px 0.5px'
// };

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


export default class NetworkD3 {
    constructor(el, figure, onClick) {
        const self = this;
        self.el = el;

        self.update = self.update.bind(self);
        self.tick = self.tick.bind(self);
        self.drag = self.drag.bind(self);
        self.wrappedClick = self.wrappedClick.bind(self);
        self.zoomed = self.zoomed.bind(self);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        self.color = d => d.color || colorScale(d.group || d.id);
        self.source_color = d => d.source_color;
        self.target_color = d => d.target_color;

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
        // let texts = self.textGroup.selectAll('text');
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
            self.simulation.nodes(self.nodeData)
                .force("forceX", d3.forceX().x(width / 2))
                .force("forceY", d3.forceY().y(height / 2))
                .force("center", d3.forceCenter().x(width / 2).y(height / 2));


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

            // texts = texts.data(self.nodeData, d => d.id);
            // texts.exit().remove();
            // texts = texts.enter().append('text')
            //     .style('fill', textStyle.fill)
            //     .style('text-anchor', textStyle.textAnchor)
            //     .style('font-size', textStyle.fontSize)
            //     .style('font-family', textStyle.fontFamily)
            //     .style('text-shadow', textStyle.textShadow)
            //   .merge(texts)
            //     .text(d => d.id);
        }

        self.links = links;
        self.nodes = nodes;
        // self.texts = texts;

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
            // .attr("stop-color", d => this.color(d.source));
        enterLinearGradients.append("svg:stop")
            .attr("class", "stop--second")
            .attr("offset", "100%");
            // .attr("stop-color", d => this.color(d.target));

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
                    d.x = self.getClientBoundingX(d.x);
                    return d.x;
                })
                .attr("cy", d => {
                    d.y = self.getClientBoundingY(d.y);
                    return d.y;
                });

            self.links
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            

            // self.texts
            //     .attr('x', d => d.x)
            //     .attr('y', d => d.y);

            self.defs.selectAll("linearGradient").each(function(d) {
                const {source, target} = d;
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
        return Math.max(nodeRadius, Math.min(width - nodeRadius, x));
    }

    getClientBoundingY(y) {
        const {height, nodeRadius} = this.figure;
        return Math.max(nodeRadius, Math.min(height - nodeRadius, y));
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
