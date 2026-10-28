import chart from '@/data/size-chart.json';
import drop from '@/data/drops.json';
import seedMembers from '@/data/members.json';

export const getSizeChart = () => chart;
export const getDrop = () => ({ ...drop });
export const getMembers = () => [...seedMembers];
