import { binsearchNext, binsearchPrevious } from './utils';

const TEST_DATA: [number, number][] = [
  1,   3,  3,  3,  5,  5,  6,  9, 10, 11, 
  11, 11, 11, 14, 14, 14, 14, 14, 19, 19,
  20, 21, 22, 22, 22, 24, 27, 27, 28, 31, 
  31, 32, 32, 33, 34, 40, 41, 42, 42, 42, 
  42, 42, 42, 42, 45, 46, 46, 47, 48, 50, 
  50, 50, 50, 50,
].map(n => [n, 0]);

describe('JSON Movie Storage utils test suit', () => {
  describe('binsearchPrevious()', () => {
    it.each([
      [0,-1],
      [2, 0],
      [3, 0],
      [4, 3],
      [5, 3],
      [7, 6],
      [11, 8],
      [12, 12],
      [14, 12],
      [15, 17],
      [16, 17],
      [18, 17],
      [21, 20],
      [23, 24],
      [25, 25],
      [26, 25],
      [27, 25],
      [28, 27],
      [30, 28],
      [33, 32],
      [35, 34],
      [37, 34],
      [40, 34],
      [42, 36],
      [45, 43],
      [48, 47],
      [50, 48],
      [51, 53],
      [60, 53],
      [100, 53]
    ])('Should return index of the last number that is less than given x (%d)', (x, expectedIdx)=>{
      expect(binsearchPrevious(TEST_DATA, x)).toEqual(expectedIdx);
    });
  });
  describe('binsearchNext()', () => {
    it.each([
      [0, 0],
      [2, 1],
      [3, 4],
      [4, 4],
      [5, 6],
      [7, 7],
      [11, 13],
      [12, 13],
      [14, 18],
      [15, 18],
      [16, 18],
      [18, 18],
      [21, 22],
      [23, 25],
      [25, 26],
      [26, 26],
      [27, 28],
      [28, 29],
      [30, 29],
      [33, 34],
      [35, 35],
      [37, 35],
      [40, 36],
      [42, 44],
      [45, 45],
      [48, 49],
      [50, 54],
      [51, 54],
      [60, 54],
      [100, 54]
    ])('Should return index of the first number that is greater than given x (%d)', (x, expectedIdx)=>{
      expect(binsearchNext(TEST_DATA, x)).toEqual(expectedIdx);
    });
  });
});
