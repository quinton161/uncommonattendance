import React from 'react';
import * as FiIcons from 'react-icons/fi';

interface IconProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

const getFiIcon = (name: string) => {
  // Use dynamic access so we don't hard-fail if an icon name changes.
  return (FiIcons as any)[name] as React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }> | undefined;
};

const IconFromFi: React.FC<{ iconName: string } & IconProps> = ({ iconName, size = 24, style, className }) => {
  const IconComp = getFiIcon(iconName);
  if (!IconComp) return null;
  return <IconComp size={size} style={style} className={className} />;
};

export const DashboardIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiGrid" {...props} />;
export const EventIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiCalendar" {...props} />;
export const CheckCircleIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiCheckCircle" {...props} />;
export const PeopleIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiUsers" {...props} />;
export const PersonIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiUser" {...props} />;
export const LogoutIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiLogOut" {...props} />;
export const AddIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiPlus" {...props} />;
export const TrendingUpIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiTrendingUp" {...props} />;
export const EventAvailableIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiCheckSquare" {...props} />;
export const GroupIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiUsers" {...props} />;
export const TodayIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiCalendar" {...props} />;
export const ScheduleIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiClock" {...props} />;
export const LocationOnIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiMapPin" {...props} />;
export const AssignmentIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiClipboard" {...props} />;
export const BarChartIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiBarChart2" {...props} />;
export const LoginIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiLogIn" {...props} />;
export const EditIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiEdit2" {...props} />;
export const DeleteIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiTrash2" {...props} />;
export const WiFiIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiWifi" {...props} />;
export const CancelIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiXCircle" {...props} />;
export const CalendarIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiCalendar" {...props} />;
export const ArrowBackIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiArrowLeft" {...props} />;
export const ArrowForwardIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiArrowRight" {...props} />;
export const UploadIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiUpload" {...props} />;
export const WifiOffIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiWifiOff" {...props} />;
export const MessageIcon: React.FC<IconProps> = (props) => <IconFromFi iconName="FiMessageSquare" {...props} />;
