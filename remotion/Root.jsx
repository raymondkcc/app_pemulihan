import React from 'react';
import {Composition} from 'remotion';
import {FiveBarChart} from './FiveBarChart';

export const RemotionRoot = () => {
  return (
    <Composition
      id="FiveBarChart"
      component={FiveBarChart}
      durationInFrames={180}
      fps={30}
      width={1080}
      height={1080}
    />
  );
};
