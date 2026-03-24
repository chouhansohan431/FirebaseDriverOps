import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const baseWidth = 375;
const baseHeight = 812;

export const rw = (size: number) => (width / baseWidth) * size;
export const rh = (size: number) => (height / baseHeight) * size;
export const rs = (size: number) => Math.round((rw(size) + rh(size)) / 2);

export const spacing = {
  xs: rs(6),
  sm: rs(10),
  md: rs(14),
  lg: rs(18),
  xl: rs(24),
};

export const radius = {
  sm: rs(8),
  md: rs(12),
  lg: rs(16),
  xl: rs(22),
};

