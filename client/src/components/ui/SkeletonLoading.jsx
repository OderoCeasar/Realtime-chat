import React from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";



function SkeletonLoading({ heigth, count }) {
    return(
        <div>
            <Skeleton style={{ height: `${heigth}px`, width: "100%" }} count={count} />
        </div>
    )
}


export default SkeletonLoading;