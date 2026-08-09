import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const DATA = [
  {label: 'Mon', value: 12, color: '#FF745E'},
  {label: 'Tue', value: 18, color: '#F7C84B'},
  {label: 'Wed', value: 26, color: '#54CBAE'},
  {label: 'Thu', value: 21, color: '#7098F5'},
  {label: 'Fri', value: 34, color: '#AA84E8'},
];

const MAX_VALUE = 40;
const CHART_TOP = 18;
const CHART_BOTTOM = 390;
const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP;
const BAR_WIDTH = 104;
const BAR_GAP = 52;
const BAR_START_X = 94;
const GRID_VALUES = [0, 10, 20, 30, 40];

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

export const FiveBarChart = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleProgress = interpolate(frame, [0, 24], [0, 1], {
    easing: easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cardProgress = interpolate(frame, [4, 34], [0, 1], {
    easing: easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headerProgress = interpolate(frame, [16, 46], [0, 1], {
    easing: easeOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#122035',
        color: '#F9F5EB',
        fontFamily: 'Arial, Helvetica, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          backgroundImage:
            'radial-gradient(circle at 12% 10%, rgba(255, 255, 255, 0.18) 0, rgba(255, 255, 255, 0) 27%), radial-gradient(circle at 92% 88%, rgba(84, 203, 174, 0.22) 0, rgba(84, 203, 174, 0) 25%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 68,
          left: 74,
          right: 74,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          opacity: titleProgress,
          transform: `translateY(${interpolate(titleProgress, [0, 1], [18, 0])}px)`,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#8CE3C5',
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 99,
                backgroundColor: '#8CE3C5',
                boxShadow: '0 0 0 6px rgba(140, 227, 197, 0.11)',
              }}
            />
            Pemulihan Learning
          </div>
          <h1
            style={{
              margin: '18px 0 0',
              fontSize: 54,
              lineHeight: 1.03,
              letterSpacing: -2.4,
              fontWeight: 800,
            }}
          >
            Weekly practice
          </h1>
          <p
            style={{
              margin: '14px 0 0',
              color: '#B8C2D0',
              fontSize: 22,
              lineHeight: 1.35,
            }}
          >
            Short sessions add up.
          </p>
        </div>

        <div
          style={{
            width: 214,
            paddingTop: 10,
            opacity: headerProgress,
            transform: `translateY(${interpolate(headerProgress, [0, 1], [14, 0])}px)`,
          }}
        >
          <div style={{color: '#AEB9C8', fontSize: 16, letterSpacing: 1.3}}>
            TOTAL THIS WEEK
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              marginTop: 7,
            }}
          >
            <span style={{fontSize: 50, lineHeight: 1, fontWeight: 800}}>
              111
            </span>
            <span style={{color: '#8CE3C5', fontSize: 21, fontWeight: 700}}>
              min
            </span>
          </div>
          <div
            style={{
              display: 'inline-flex',
              marginTop: 16,
              padding: '8px 13px',
              borderRadius: 99,
              backgroundColor: 'rgba(140, 227, 197, 0.13)',
              color: '#8CE3C5',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            +18% from last week
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 64,
          width: 952,
          height: 666,
          borderRadius: 30,
          backgroundColor: '#F9F5EB',
          boxShadow: '0 24px 50px rgba(2, 11, 25, 0.2)',
          opacity: cardProgress,
          transform: `translateY(${interpolate(cardProgress, [0, 1], [28, 0])}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: 42,
            right: 42,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{color: '#1E2D42', fontSize: 23, fontWeight: 800}}>
              Practice minutes
            </div>
            <div style={{marginTop: 6, color: '#7B8490', fontSize: 17}}>
              A five-day snapshot of focused learning time
            </div>
          </div>
          <div
            style={{
              padding: '10px 15px',
              border: '1px solid #E5DED0',
              borderRadius: 99,
              color: '#6E7784',
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            THIS WEEK
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 42,
            right: 42,
            top: 126,
            bottom: 56,
          }}
        >
          {GRID_VALUES.map((gridValue) => {
            const y = CHART_BOTTOM - (gridValue / MAX_VALUE) * CHART_HEIGHT;
            return (
              <React.Fragment key={gridValue}>
                <div
                  style={{
                    position: 'absolute',
                    top: y - 1,
                    left: 58,
                    right: 0,
                    height: 1,
                    backgroundColor: gridValue === 0 ? '#C8C0B2' : '#E7E0D5',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: y - 11,
                    left: 0,
                    width: 42,
                    color: '#8D938F',
                    fontSize: 15,
                    textAlign: 'right',
                  }}
                >
                  {gridValue}
                </div>
              </React.Fragment>
            );
          })}

          {DATA.map((item, index) => {
            const progress = Math.min(
              1,
              spring({
                frame,
                fps,
                delay: 27 + index * 7,
                config: {damping: 200},
              }),
            );
            const barHeight = progress * (item.value / MAX_VALUE) * CHART_HEIGHT;
            const barTop = CHART_BOTTOM - barHeight;
            const x = BAR_START_X + index * (BAR_WIDTH + BAR_GAP);
            const valueOpacity = interpolate(progress, [0, 0.45], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <React.Fragment key={item.label}>
                <div
                  style={{
                    position: 'absolute',
                    left: x,
                    top: CHART_TOP,
                    width: BAR_WIDTH,
                    height: CHART_HEIGHT,
                    borderRadius: 18,
                    backgroundColor: '#EEE8DC',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: x,
                    top: barTop,
                    width: BAR_WIDTH,
                    height: barHeight,
                    borderRadius: 18,
                    background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}D9 100%)`,
                    boxShadow: `0 10px 18px ${item.color}36`,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 11,
                      left: 12,
                      right: 12,
                      height: 5,
                      borderRadius: 5,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: barTop - 40,
                    left: x,
                    width: BAR_WIDTH,
                    color: '#25364B',
                    fontSize: 22,
                    fontWeight: 800,
                    textAlign: 'center',
                    opacity: valueOpacity,
                    transform: `translateY(${interpolate(valueOpacity, [0, 1], [8, 0])}px)`,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: CHART_BOTTOM + 28,
                    left: x,
                    width: BAR_WIDTH,
                    color: '#6D7884',
                    fontSize: 17,
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {item.label}
                </div>
              </React.Fragment>
            );
          })}

          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: -42,
              color: '#9A9B96',
              fontSize: 14,
            }}
          >
            minutes
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 74,
          bottom: 49,
          color: '#7F8A9A',
          fontSize: 14,
          letterSpacing: 0.3,
          opacity: headerProgress,
        }}
      >
        Consistency beats cramming.
      </div>
      <div
        style={{
          position: 'absolute',
          right: 74,
          bottom: 49,
          color: '#7F8A9A',
          fontSize: 14,
          opacity: headerProgress,
        }}
      >
        01 / 01
      </div>
    </AbsoluteFill>
  );
};
