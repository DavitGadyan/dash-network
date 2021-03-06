import React from "react";

/**
 * getViewBox function, based on D3 force layout
 */
const getViewBox = name => {
  switch (name) {
    case "pan":
      return "0 0 1000 1000";
    case "lasso":
      return "0 0 1031 1000";  
    case "zoomin":
      return "0 0 192 192";   
    case "zoomout":
      return "0 0 192 192";   
    default:
      return "0 0 1000 1000";
  }
};

/**
 * getPath function, based on D3 force layout
 */
const getPath = (name, props) => {
  switch (name) {
    case "pan":
      return (
        <path
          {...props}
          d="m1000 350l-187 188 0-125-250 0 0 250 125 0-188 187-187-187 125 0 0-250-250 0 0 125-188-188 186-187 0 125 252 0 0-250-125 0 187-188 188 188-125 0 0 250 250 0 0-126 187 188z" transform="matrix(1 0 0 -1 0 850)"
        />
      );
    case "lasso":
      return (
        <path
          {...props}
          d="m1018 538c-36 207-290 336-568 286-277-48-473-256-436-463 10-57 36-108 76-151-13-66 11-137 68-183 34-28 75-41 114-42l-55-70 0 0c-2-1-3-2-4-3-10-14-8-34 5-45 14-11 34-8 45 4 1 1 2 3 2 5l0 0 113 140c16 11 31 24 45 40 4 3 6 7 8 11 48-3 100 0 151 9 278 48 473 255 436 462z m-624-379c-80 14-149 48-197 96 42 42 109 47 156 9 33-26 47-66 41-105z m-187-74c-19 16-33 37-39 60 50-32 109-55 174-68-42-25-95-24-135 8z m360 75c-34-7-69-9-102-8 8 62-16 128-68 170-73 59-175 54-244-5-9 20-16 40-20 61-28 159 121 317 333 354s407-60 434-217c28-159-121-318-333-355z" transform="matrix(1 0 0 -1 0 850)"
        />
      );   
    case "zoomin":
      return ([
        <path
          {...props}
          d="M190.707,180.101l-47.078-47.077c11.702-14.072,18.752-32.142,18.752-51.831C162.381,36.423,125.959,0,81.191,0 C36.422,0,0,36.423,0,81.193c0,44.767,36.422,81.187,81.191,81.187c19.688,0,37.759-7.049,51.831-18.751l47.079,47.078 c1.464,1.465,3.384,2.197,5.303,2.197c1.919,0,3.839-0.732,5.304-2.197C193.637,187.778,193.637,183.03,190.707,180.101z M15,81.193C15,44.694,44.693,15,81.191,15c36.497,0,66.189,29.694,66.189,66.193c0,36.496-29.692,66.187-66.189,66.187    C44.693,147.38,15,117.689,15,81.193z" transform="matrix(1 0 0 1 0 0)"
        />,
        <path
          {...props}
          d="M118.035,73.689H88.69V44.345c0-4.142-3.357-7.5-7.5-7.5s-7.5,3.358-7.5,7.5v29.345H44.346c-4.143,0-7.5,3.358-7.5,7.5 c0,4.142,3.357,7.5,7.5,7.5H73.69v29.346c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5V88.689h29.345c4.143,0,7.5-3.358,7.5-7.5 C125.535,77.047,122.178,73.689,118.035,73.689z" transform="matrix(1 0 0 1 0 0)"
        />
        ]
      );  
    case "zoomout":
      return ([
        <path
          {...props}
          d="M190.707,180.101l-47.079-47.077c11.702-14.072,18.752-32.142,18.752-51.831C162.381,36.423,125.959,0,81.191,0 C36.422,0,0,36.423,0,81.193c0,44.767,36.422,81.187,81.191,81.187c19.689,0,37.759-7.049,51.831-18.75l47.079,47.077 c1.464,1.465,3.384,2.197,5.303,2.197c1.919,0,3.839-0.732,5.303-2.197C193.637,187.778,193.637,183.03,190.707,180.101z M15,81.193C15,44.694,44.693,15,81.191,15c36.497,0,66.189,29.694,66.189,66.193c0,36.496-29.692,66.187-66.189,66.187  C44.693,147.38,15,117.689,15,81.193z" transform="matrix(1 0 0 1 0 0)"
        />
      ,
      
        <path
          {...props}
          d="M118.035,73.689H44.346c-4.142,0-7.5,3.358-7.5,7.5c0,4.142,3.358,7.5,7.5,7.5h73.689c4.142,0,7.5-3.358,7.5-7.5    C125.535,77.047,122.177,73.689,118.035,73.689z" transform="matrix(1 0 0 1 0 0)"
        />
      ]);  
    default:
      return <path />;
  }
};

/**
 * SVGIcon component, based on D3 force layout
 */

const SVGIcon = ({
  name = "",
  style = {},
  fill = "#000",
  viewBox = "",
  width = "100%",
  className = "icon",
  height = "100%"
}) => (
  <svg
    width={width}
    style={style}
    height={height}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox={viewBox || getViewBox(name)}
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    {getPath(name, { fill })}
  </svg>
);

SVGIcon.propTypes = {
  /**
   * SVGIcon name
   */
  name: PropTypes.string,

  /**
   * SVGIcon style
   */
  style: PropTypes.arrayOf(PropTypes.string),

  /**
   * SVGIcon fill
   */
  fill: PropTypes.string,

  /**
   * SVGIcon viewBox
   */
  viewBox: PropTypes.string,

  /**
   * SVGIcon width
   */
  width: PropTypes.string,

  /**
   * SVGIcon height
   */
  height: PropTypes.string,

  /**
   * SVGIcon className
   */
  className: PropTypes.string,

};

/**
 * SVGIcon component, based on D3 force layout
 */
export default SVGIcon;
