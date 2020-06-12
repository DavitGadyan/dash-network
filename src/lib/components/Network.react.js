import React, {Component} from 'react';
import PropTypes from 'prop-types';
import NetworkD3 from '../d3/network';
import SVGIcon from "./SVGIcon";

import "./network.css"  

/**
 * Network graph component, based on D3 force layout
 */
export default class Network extends Component {
    constructor(props) {
        super(props);
        this.state = {           
           toolbar_pan_value: 0,
           toolbar_pan_class: "modebar-btn",
           toolbar_lasso_value: 0,
           toolbar_lasso_class: "modebar-btn",
           toolbar_zoomin_value: 0,
           toolbar_zoomin_class: "modebar-btn"
        };
        this.init_toolbar = this.init_toolbar.bind(this);
        this.click_toolbar = this.click_toolbar.bind(this);
    }

    componentDidMount() {
        this.network = new NetworkD3(this.el, this.props, node => {
           const {setProps} = this.props;
           const selectedId = node && node.id;

           if (setProps) { setProps({selectedId}); }
           else { this.setState({selectedId}); }
       });
    }

    componentDidUpdate() {
        this.network.update(this.props);
    }

    init_toolbar(){
        this.setState({
            toolbar_pan_value: 0,
            toolbar_pan_class: "modebar-btn",
            toolbar_lasso_value: 0,
            toolbar_lasso_class: "modebar-btn",
            toolbar_zoomin_value: 0,
            toolbar_zoomin_class: "modebar-btn"
        });   
    }
    click_toolbar(e) {
        e.preventDefault(); 

        var val = e.currentTarget.dataset.name;
        var pre_state = this.state;
        this.init_toolbar();

        if(val == "pan"){
            if(pre_state.toolbar_pan_value == 0){                
                this.setState({
                    toolbar_pan_value: 1,
                    toolbar_pan_class: "modebar-btn active"                    
                });   
                this.network.update_mode("pan");             
            }
            else{
                this.setState({
                    toolbar_pan_value: 0,
                    toolbar_pan_class: "modebar-btn"                    
                });  
                this.network.update_mode("init");    
            }            
        }
        else if(val=="lasso"){
            if(pre_state.toolbar_lasso_value == 0){                
                this.setState({
                    toolbar_lasso_value: 1,
                    toolbar_lasso_class: "modebar-btn active"                    
                });   
                this.network.update_mode("lasso");             
            }
            else{
                this.setState({
                    toolbar_lasso_value: 0,
                    toolbar_lasso_class: "modebar-btn"                    
                });  
                this.network.update_mode("init");    
            }      
        }
        else if(val=="zoomin"){            
            this.setState({
                toolbar_zoomin_value: 1,
                toolbar_zoomin_class: "modebar-btn active"                    
            }); 
            this.network.update_mode("zoomin");                                 
        }
    }


    render() {
        return (
            <div className={'main_div'} id={this.props.id} ref={el => {this.el = el}}>
                <div className={"modebar-container"}>  
                    <div className={"modebar modebar--hover ease-bg"}>
                        <div className={"modebar-group"}>
                            <a className={this.state.toolbar_pan_class} data-name={"pan"} onClick={this.click_toolbar}>
                                <SVGIcon name="pan" width={100} fill={""} />
                            </a>            
                            <a className={this.state.toolbar_lasso_class} data-name={"lasso"} onClick={this.click_toolbar}>
                                <SVGIcon name="lasso" width={100} fill={""} />
                            </a> 
                            <a className={this.state.toolbar_zoomin_class} data-name={"zoomin"} onClick={this.click_toolbar}>
                                <SVGIcon name="zoomin" width={100} fill={""} />
                            </a> 
                        </div>  
                    </div>
                </div>
            </div> 
            );
    }
}

Network.defaultProps = {
    height: 500,
    linkWidth: 4,
    maxLinkWidth: 20,
    nodeRadius: 10,
    maxRadius: 20
};

Network.propTypes = {
    /**
     * The ID used to identify this component in Dash callbacks
     */
    id: PropTypes.string,

    /**
     * Dash-assigned callback that should be called whenever any of the
     * properties change
     */
    setProps: PropTypes.func,

    /**
     * Width of the figure to draw, in pixels
     */
    width: PropTypes.number,

    /**
     * Height of the figure to draw, in pixels
     */
    height: PropTypes.number,

    /**
     * The network data. Should have the form:
     *
     *   `{nodes: [node0, node1, ...], links: [link0, link1, ...]}`
     *
     * nodes have the form:
     *
     *   `{id: 'node id'[, radius: number][, color: 'css color string']}`
     *
     * `id` is required, must be unique, and is used both in links and
     * as the node text.
     * `radius` is an optional relative radius, scaled by `maxRadius`
     * `color` is an optional css color string.
     *
     * links have the form:
     *
     *   `{source: sourceId, target: targetId[, width: number]}`
     *
     * `source` and `target` are required, and must match node ids.
     * `width` is an optional relative width, scaled by `maxLinkWidth`
     */
    data: PropTypes.object.isRequired,

    /**
     * Optional version id for data, to avoid having to diff a large object
     */
    dataVersion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    /**
     * Optional default width of links, in px
     */
    linkWidth: PropTypes.number,

    /**
     * Optional maximum width of links, in px. If individual links have `width`,
     * these will be scaled linearly so the largest one has width `maxLinkWidth`.
     */
    maxLinkWidth: PropTypes.number,

    /**
     * Optional default radius of nodes, in px
     */
    nodeRadius: PropTypes.number,

    /**
    * Optional maximum radius of nodes, in px. If individual nodes have `radius`,
    * these will be scaled linearly so the largest one has radius `maxRadius`.
     */
    maxRadius: PropTypes.number,

    /**
     * The currently selected node id
     */
    selectedId: PropTypes.string
};
