import * as d3 from 'd3';

// import { useI18n } from 'vue-i18n';
import i18n from '../../static/i18n.ts';

const { t } = i18n.global;

export class RecordingStatus {
    constructor(containerId, options = {}) {
        const defaults = {
            modeType: "month",
            width: 1658,
            height: 690,
            backgroundColor: "#f0f0f0",
            labelFontSize: 14,
            labelColor: "#000",
            startTime: null,
            endTime: null,
            callback: null,
        };

        this.colors = [
            "#0399FE", "#3FAD98", "#D4BA3F",
            "#E78AC3", "#8DA0CB", "#0F9355", "#A35BBE"
        ];
        this.options = { ...defaults, ...options };
        this.containerId = containerId;
        this.data = [];

        this._initSVG(containerId);
        this._initTooltip(); // init tooltip
    }

    // Initialise SVG canvas
    _initSVG(containerId) {
        this.svg = d3.select(containerId)
            .append("svg")
            .attr("width", this.options.width)
            .attr("height", this.options.height)
            .style("user-select", "none");

        this.layers = {
            timeLabels: this.svg.append("g").attr("class", "time-labels"),
            highlights: this.svg.append("g").attr("class", "highlights"),
        };
    }

    // Initialise tooltip
    _initTooltip() {
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "recording-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.75)")
            .style("color", "#fff")
            .style("padding", "6px 10px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", 9999);
    }

    // Main entry point
    StartDrawing(data) {
        this.data = data || [];
        console.log(this.data);
        this._initTimeScale();
        this._drawTimeLabels();
        this._createChannelAxis(data);
    }
    SetRecordData(data) {
        this.data = data;
    }
    // Initialise time scale
    _initTimeScale() {
        const { startTime, endTime, width, modeType } = this.options;
        const now = new Date();
        let start, end;

        switch (modeType) {
            case "date":
                start = startTime || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                end = endTime || new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case "week":
                const day = now.getDay() || 7;
                const monday = new Date(now);
                monday.setDate(now.getDate() - day + 1);
                monday.setHours(0, 0, 0, 0);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);
                start = startTime || monday;
                end = endTime || sunday;
                break;
            case "month":
            default:
                start = startTime || new Date(now.getFullYear(), now.getMonth(), 1);
                end = endTime || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
                break;
        }

        this.x = d3.scaleTime()
            .domain([start, end])
            .range([0, width]);
    }

    // Draw time-label backgrounds and text
    _drawTimeLabels() {
        const group = this.layers.timeLabels;
        group.selectAll("*").remove();
        group.attr("transform", `translate(0, 0)`);

        group.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.options.width)
            .attr("height", 48)
            .attr("fill", this.options.backgroundColor)
        // .attr("stroke", "#ccc");

        let ticks;
        switch (this.options.modeType) {
            case "date":
                ticks = this.x.ticks(d3.timeHour.every(2));
                break;
            case "week":
                ticks = this.x.ticks(d3.timeDay.every(1));
                break;
            case "month":
            default:
                ticks = this.x.ticks(d3.timeDay.every(1));
                break;
        }

        group.selectAll(".date-label")
            .data(ticks)
            .enter()
            .append("text")
            .attr("class", "date-label")
            .attr("x", d => this.x(d) + 20)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", `${this.options.labelFontSize}px`)
            .style("fill", this.options.labelColor)
            .text(d => this._formatTimeLabel(d));
    }

    // Draw highlight for a single recording segment
    _addRecordingHighlight(record, channelIndex, devName, rowY, rowHeight) {
        const start = new Date(record.strStartTime);
        const end = new Date(record.strEndTime);
        end.setSeconds(end.getSeconds() + 1);
        const x1 = this.x(start);
        const x2 = this.x(end);
        // Use integer pixels to avoid floating-point precision issues
        const intX1 = Math.floor(x1);
        const intX2 = Math.ceil(x2);
        const width = Math.max(1, intX2 - intX1); // ensure min width of 1px
        // Same colour for all segments of the same channel
        let fillColor;
        if (this.options.router === 'recordInfo') {
            const types = [
                'H5_STOR_REC_ALERT',    // alarm recording
                'H5_STOR_REC_A_MOTION', // alarm recording
                'H5_STOR_REC_A_OBJECT', // alarm recording
                'H5_STOR_REC_N_MANUAL', // manual recording
                'H5_STOR_REC_N_SCHED'   // scheduled recording
            ];
            const item = record.type.find(val => types.includes(val));
            switch (item) {
                case 'H5_STOR_REC_ALERT':
                    fillColor = '#ee1011'
                    break;
                case 'H5_STOR_REC_A_MOTION':
                    fillColor = '#ee1011'
                    break;
                case 'H5_STOR_REC_A_OBJECT':
                    fillColor = '#ee1011'
                    break;
                case 'H5_STOR_REC_N_MANUAL':
                    fillColor = '#3cc43c'
                    break;
                case 'H5_STOR_REC_N_SCHED':
                    fillColor = '#2188E2'
                    break;
            }
        } else {
            fillColor = this.colors[channelIndex % this.colors.length];
        }
        // const fillColor = this.colors[channelIndex % this.colors.length];

        this.layers.highlights.append("rect")
            .attr("x", x1)
            .attr("y", rowY)
            .attr("width", width)
            .attr("height", rowHeight)
            .attr("fill", fillColor)
            .attr("class", "time-highlight")
            .on("mouseover", (event) => {
                const html = this._createTooltipHtml(event, record, fillColor, devName);
                this.tooltip.html(html)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 12}px`)
                    .style("top", `${event.pageY + 12}px`);
            })
            .on("mousemove", (event) => {
                const html = this._createTooltipHtml(event, record, fillColor, devName);
                this.tooltip.html(html)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 12}px`)
                    .style("top", `${event.pageY + 12}px`);
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget).attr("fill", fillColor);
                this.tooltip.transition().duration(0).style("opacity", 0);
            });
    }
    // Build tooltip HTML
    _createTooltipHtml(event, record, fillColor, devName) {
        const start = new Date(record.strStartTime);
        const end = new Date(record.strEndTime);
        const rect = d3.select(event.currentTarget);
        rect.attr("fill", d3.color(fillColor).brighter(0.5));

        const [mouseX] = d3.pointer(event);
        const fmt = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        const currentTime = this.x.invert(mouseX);
        const html = `
        <div><span style="font-size:10px;color:${fillColor};">● </span> &nbsp;<b>${t('Common.comm_channel_name')}：</b>${devName}</div>
        <div><span style="font-size:10px;color:${fillColor};">● </span> &nbsp;<b>${t('Common.comm_time_current')}：</b>${fmt(currentTime)}</div>
        <br/>
        <div><span style="font-size:10px;color:${fillColor};">● </span> &nbsp;<b>${t('Common.comm_time_start')}：</b>${fmt(start)}</div>
        <div><span style="font-size:10px;color:${fillColor};">● </span> &nbsp;<b>${t('Common.comm_time_end')}：</b>${fmt(end)}</div>
    `;
        return html;
    }
    // Draw all segments for a channel
    _addChannelHighlights(channelData, index) {
        if (!channelData) {
            return;
        }
        const labelWidth = 48;
        const rowHeight = 24;
        const rowY = labelWidth + index * rowHeight;

        // Draw all segments for this channel
        if (channelData.record && Array.isArray(channelData.record)) {
            channelData.record.forEach((record) => {
                this._addRecordingHighlight(record, index, channelData.devName, rowY, rowHeight);
            });
        }
        // Draw channel label (first row only)
        if (channelData.record) {
            this.layers.highlights.append("text")
                .attr("x", 5)
                .attr("y", rowY + 16)
                .attr("text-anchor", "start")
                .style("font-size", `${this.options.labelFontSize}px`)
                .style("fill", this.options.labelColor)
                .text(`${channelData.devName}`);
        }
    }
    createHtml(event, data, fillColor) {
        const start = new Date(data.strStartTime);
        const end = new Date(data.strEndTime);
        const rect = d3.select(event.currentTarget);
        rect.attr("fill", d3.color(fillColor).brighter(0.5));
        const [mouseX] = d3.pointer(event);
        const fmt = d3.timeFormat("%Y-%m-%d %H:%M:%S");
        const currentTime = this.x.invert(mouseX);
        const html = `
                    <div> <span style="font-size:10px;color:#0399FE;">● </span> &nbsp;<b>${t('Common.comm_channel_name')}：</b>${data.devName}</div>
                    <div><span style="font-size:10px;">● </span> &nbsp;<b>${t('Common.comm_time_current')}：</b>${fmt(currentTime)}</div>
                    <br/>
                    <div><span style="font-size:10px;color:#0399FE;">● </span> &nbsp;<b>${t('Common.comm_time_start')}：</b>${fmt(start)}</div>
                    <div><span style="font-size:10px;color:#0399FE;">● </span> &nbsp;<b>${t('Common.comm_time_end')}：</b>${fmt(end)}</div>
                `;
        return html;
    }
    // Create channel axis
    _createChannelAxis(data) {
        const group = this.layers.highlights;
        group.selectAll("*").remove();
        data.forEach((el, i) => this._addChannelHighlights(el, i));
    }

    // Format time labels
    _formatTimeLabel(date) {
        const { modeType } = this.options;
        const formats = { month: "%m/%d", week: "%m/%d", date: "%H:%M" };
        return d3.timeFormat(formats[modeType] || "%m/%d")(date);
    }

    // Toggle mode and redraw
    setMode(mode, time) {
        if (!["month", "week", "date"].includes(mode)) {
            console.warn("Invalid mode:", mode);
            return;
        }
        this.options.modeType = mode;
        this.options.startTime = time.startTime;
        this.options.endTime = time.endTime;
        this._initTimeScale();
        this._drawTimeLabels();
        this._createChannelAxis(this.data);
    }
    setColors(colors) {
        this.options.backgroundColor = colors.backgroundColor;
        this.options.labelColor = colors.labelColor;
        this._initTimeScale();
        this._drawTimeLabels();
        this._createChannelAxis(this.data);
    }
    // Destroy and clean up
    destroy() {
        this.svg?.remove();
        this.tooltip?.remove();
        this.svg = null;
        this.tooltip = null;
        this.layers = null;
    }
}
