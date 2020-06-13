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
      return "0 0 500 500";    
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
      return (
        <path
          {...props}
          d="M319.8 204v8c0 6.6-5.4 12-12 12h-84v84c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12v-84h-84c-6.6 0-12-5.4-12-12v-8c0-6.6 5.4-12 12-12h84v-84c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v84h84c6.6 0 12 5.4 12 12zm188.5 293L497 508.3c-4.7 4.7-12.3 4.7-17 0l-129-129c-2.3-2.3-3.5-5.3-3.5-8.5v-8.5C310.6 395.7 261.7 416 208 416 93.8 416 1.5 324.9 0 210.7-1.5 93.7 93.7-1.5 210.7 0 324.9 1.5 416 93.8 416 208c0 53.7-20.3 102.6-53.7 139.5h8.5c3.2 0 6.2 1.3 8.5 3.5l129 129c4.7 4.7 4.7 12.3 0 17zM384 208c0-97.3-78.7-176-176-176S32 110.7 32 208s78.7 176 176 176 176-78.7 176-176z" transform="matrix(1 0 0 1 50 0)"
        />
      );  
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

/**
 * SVGIcon component, based on D3 force layout
 */
export default SVGIcon;
