export interface NavigationState {
    originalRoot: string;
    currentRoot: string;
    navigationStack: string[];
    originalExcludes: { [key: string]: boolean };
}