import {
  BASE_FLAG_COLOR,
  BASE_FLAG_FA,
} from './constants';
import { blendHex } from './flags';

const FLAG_KEYS = [
  'LOW_DATA',
  'ENGAGEMENT_TRAINING',
  'EXEMPLAR',
  'OK',
];

const MIN_RADIUS = 52;
const RADIUS_SPAN = 80;
const GROUP_GAP = 38;
const VIEWBOX_PADDING = 44;

const intersectionSize = (
  first,
  second
) => {
  const [small, large] =
    first.size <= second.size
      ? [first, second]
      : [second, first];

  let count = 0;

  small.forEach((value) => {
    if (large.has(value)) {
      count += 1;
    }
  });

  return count;
};

const exclusiveSize = (
  flag,
  members
) =>
  [...members[flag]].filter(
    (name) =>
      FLAG_KEYS.every(
        (otherFlag) =>
          otherFlag === flag ||
          !members[otherFlag].has(name)
      )
  ).length;

const radiusForCount = (
  count,
  maxCount
) =>
  MIN_RADIUS +
  Math.sqrt(
    Math.max(0, count) /
      Math.max(1, maxCount)
  ) *
    RADIUS_SPAN;

const overlapDistance = (
  first,
  second,
  overlapCount
) => {
  if (overlapCount <= 0) {
    return (
      first.r +
      second.r +
      GROUP_GAP
    );
  }

  const desiredDepth =
    48 +
    Math.min(
      14,
      Math.log2(overlapCount + 1) * 4
    );

  const safeDepth =
    Math.max(
      40,
      Math.min(first.r, second.r) *
        0.78
    );

  const depth =
    Math.min(
      desiredDepth,
      safeDepth
    );

  return (
    first.r +
    second.r -
    depth
  );
};

const intersectionCenter = (
  first,
  second
) => {
  const dx =
    second.cx - first.cx;

  const dy =
    second.cy - first.cy;

  const distance =
    Math.hypot(dx, dy);

  if (distance === 0) {
    return {
      x: first.cx,
      y: first.cy,
    };
  }

  const along =
    (
      first.r * first.r -
      second.r * second.r +
      distance * distance
    ) /
    (2 * distance);

  return {
    x:
      first.cx +
      (dx / distance) * along,
    y:
      first.cy +
      (dy / distance) * along,
  };
};

const groupFontSize = (radius) =>
  Math.max(
    24,
    Math.min(
      38,
      Math.round(radius * 0.34)
    )
  );

const overlapFontSize = (count) => {
  if (count >= 100) {
    return 22;
  }

  if (count >= 10) {
    return 26;
  }

  return 30;
};

export const buildBehavioralGroupsModel = (
  rows = []
) => {
  const members =
    Object.fromEntries(
      FLAG_KEYS.map((flag) => [
        flag,
        new Set(),
      ])
    );

  rows.forEach((row, index) => {
    const physicianKey =
      String(row.name || '').trim() ||
      `__physician_${index}`;

    String(row.flags || 'OK')
      .split('|')
      .filter(Boolean)
      .forEach((flag) => {
        if (members[flag]) {
          members[flag].add(
            physicianKey
          );
        }
      });
  });

  const lowEngagementCount =
    intersectionSize(
      members.LOW_DATA,
      members.ENGAGEMENT_TRAINING
    );

  const engagementExemplarCount =
    intersectionSize(
      members.ENGAGEMENT_TRAINING,
      members.EXEMPLAR
    );

  const maxTotal =
    Math.max(
      1,
      ...FLAG_KEYS.map(
        (flag) =>
          members[flag].size
      )
    );

  const groupsByFlag =
    Object.fromEntries(
      FLAG_KEYS.map((flag) => {
        const total =
          members[flag].size;

        const r =
          radiusForCount(
            total,
            maxTotal
          );

        return [
          flag,
          {
            flag,
            label:
              BASE_FLAG_FA[flag],
            color:
              BASE_FLAG_COLOR[flag],
            total,
            exclusive:
              exclusiveSize(
                flag,
                members
              ),
            r,
            cx: 0,
            cy: 0,
            fontSize:
              groupFontSize(r),
          },
        ];
      })
    );

  const low =
    groupsByFlag.LOW_DATA;

  const engagement =
    groupsByFlag.ENGAGEMENT_TRAINING;

  const exemplar =
    groupsByFlag.EXEMPLAR;

  const ok =
    groupsByFlag.OK;

  engagement.cx = 0;
  engagement.cy = 0;

  low.cx =
    engagement.cx -
    overlapDistance(
      low,
      engagement,
      lowEngagementCount
    );

  low.cy = 0;

  exemplar.cx =
    engagement.cx +
    overlapDistance(
      engagement,
      exemplar,
      engagementExemplarCount
    );

  exemplar.cy = 0;

  ok.cx =
    exemplar.cx +
    exemplar.r +
    ok.r +
    GROUP_GAP;

  ok.cy = 0;



  const overlapDefinitions = [
    {
      id: 'low-engagement',
      firstFlag: 'LOW_DATA',
      secondFlag:
        'ENGAGEMENT_TRAINING',
      count:
        lowEngagementCount,
      label:
        'فاقد ویزیت کافی (مشکوک به کم‌حوصلگی)',
    },
    {
      id: 'engagement-exemplar',
      firstFlag:
        'ENGAGEMENT_TRAINING',
      secondFlag: 'EXEMPLAR',
      count:
        engagementExemplarCount,
      label:
        'باحوصله - کم‌حوصله',
    },
  ];

  const overlaps =
    overlapDefinitions
      .filter(
        (overlap) =>
          overlap.count > 0
      )
      .map((overlap) => {
        const first =
          groupsByFlag[
            overlap.firstFlag
          ];

        const second =
          groupsByFlag[
            overlap.secondFlag
          ];

        const center =
          intersectionCenter(
            first,
            second
          );

        return {
          ...overlap,
          color: blendHex([
            first.color,
            second.color,
          ]),
          x: center.x,
          y: center.y,
          fontSize:
            overlapFontSize(
              overlap.count
            ),
        };
      });

  const groups =
    FLAG_KEYS.map(
      (flag) =>
        groupsByFlag[flag]
    );

  const minX =
    Math.min(
      ...groups.map(
        (group) =>
          group.cx - group.r
      )
    ) -
    VIEWBOX_PADDING;

  const maxX =
    Math.max(
      ...groups.map(
        (group) =>
          group.cx + group.r
      )
    ) +
    VIEWBOX_PADDING;

  const minY =
    Math.min(
      ...groups.map(
        (group) =>
          group.cy - group.r
      )
    ) -
    VIEWBOX_PADDING;

  const maxY =
    Math.max(
      ...groups.map(
        (group) =>
          group.cy + group.r
      )
    ) +
    VIEWBOX_PADDING;

  return {
    groups,
    overlaps,
    viewBox: [
      minX,
      minY,
      maxX - minX,
      maxY - minY,
    ].join(' '),
    isEmpty:
      groups.every(
        (group) =>
          group.total === 0
      ),
  };
};