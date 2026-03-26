/**
 * Base configuration for ECharts with theme support
 */

export interface EChartThemeColors {
    backgroundColor: string
    borderColor: string
    textPrimaryColor: string
    textSecondaryColor: string
}

export const getThemeColors = (isDark: boolean): EChartThemeColors => ({
    backgroundColor: isDark ? '#2c2d2e' : '#ffffff',
    borderColor: isDark ? '#444546' : '#cbcccd',
    textPrimaryColor: isDark ? '#e1e3e6' : '#000000E5',
    textSecondaryColor: isDark ? '#76787a' : '#818c99'
})

export const getEChartBaseConfig = (isDark: boolean = false) => {
    const colors = getThemeColors(isDark)

    return {
        backgroundColor: 'transparent',
        grid: {
            left: 10,
            right: 10,
            top: 15,
            bottom: 25,
            containLabel: true
        },
        legend: {
            type: 'plain' as const,
            orient: 'horizontal' as const,
            left: 5,
            bottom: 0,
            itemWidth: 20,
            itemHeight: 2,
            textStyle: {
                color: colors.textPrimaryColor,
                fontSize: 12
            },
            icon: 'rect'
        },
        tooltip: {
            trigger: 'axis' as const,
            backgroundColor: colors.backgroundColor,
            borderColor: colors.borderColor,
            textStyle: {
                color: colors.textPrimaryColor,
                fontSize: 12
            }
        },
        xAxis: {
            type: 'category' as const,
            axisLabel: {
                show: true,
                hideOverlap: true,
                color: colors.textSecondaryColor,
                fontSize: 11
            },
            axisTick: { show: false },
            axisLine: {
                show: true,
                lineStyle: {
                    color: colors.borderColor
                }
            },
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value' as const,
            axisTick: { show: false },
            axisLine: {
                show: false
            },
            axisLabel: {
                show: true,
                color: colors.textSecondaryColor,
                fontSize: 11
            },
            splitLine: {
                show: true,
                lineStyle: {
                    width: 1,
                    color: colors.borderColor,
                    type: 'dashed' as const
                }
            }
        }
    }
}

// Chart colors palette
export const CHART_COLORS = {
    green: '#4CAF50',
    red: '#F44336',
    blue: '#2196F3',
    orange: '#FF9800',
    purple: '#9C27B0',
    cyan: '#00BCD4',
    grey: '#9E9E9E'
}
