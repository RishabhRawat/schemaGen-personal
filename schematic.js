var graph = new joint.dia.Graph;
var paper = new joint.dia.Paper({
    el: $('#schematic_container'),
    width: '100%',
    height: '100%',
    model: graph,
    gridSize: 1
});

joint.shapes.basic.AndGate = joint.shapes.basic.Generic.extend({
    markup: '<g class="component">' +
    '<path d="M0 0 h35 a25 25 0 1 1 0 50  h-35  Z" transform="translate(20 0)"/>' +
    '<path d="M0 0 h20" transform="translate(0 15)"/>' +
    '<path d="M0 0 h20" transform="translate(0 35)"/>' +
    '<path d="M0 0 h-20" transform="translate(100 25)"/>' +
    '</g>'
});

joint.shapes.basic.OrGate = joint.shapes.basic.Generic.extend({
    markup: '<g class="component">' +
    '<path d="M0 0 Q40 0 60 25 Q40 50 0 50 q20 -25 0 -50 M0 15 l8 0 M0 35 l8 0" transform="translate(20 0)"/>' +
    '<path d="M0 0 h20" transform="translate(0 15)"/>' +
    '<path d="M0 0 h20" transform="translate(0 35)"/>' +
    '<path d="M0 0 h-20" transform="translate(100 25)"/>' +
    '</g>'
});

joint.shapes.basic.NotGate = joint.shapes.basic.Generic.extend({
    markup: '<g class="component">' +
    '<path d="M0 0 L50 25 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 L0 50 Z" transform="translate(20 0)"/>' +
    '<path d="M0 0 h20" transform="translate(0 25)"/>' +
    '<path d="M0 0 h-20" transform="translate(100 25)"/>' +
    '</g>'
});

joint.shapes.basic.InputGate = joint.shapes.basic.Generic.extend({
    markup: '<g class="component">' +
    '<path d="M0 15 h40 L60 25 L40 35 h-40 Z" transform="translate(20 0)"/>' +
    '<path d="M0 0 h-20" transform="translate(100 25)"/>' +
    '</g>'
});

joint.shapes.basic.OutputGate = joint.shapes.basic.Generic.extend({
    markup: '<g class="component">' +
    '<path d="M0 25 L20 15 h40 v20 h-40 Z" transform="translate(20 0)"/>' +
    '<path d="M0 0 h20" transform="translate(0 25)"/>' +
    '</g>'
});


var rect = new joint.shapes.basic.InputGate({
    position: {x: 100, y: 30},
});

var rect2 = new joint.shapes.basic.OutputGate({
    position: {x: 100, y: 30},
});
rect2.translate(300);

var link = new joint.dia.Link({
    source: {id: rect.id},
    target: {id: rect2.id}
});


graph.addCells([rect, rect2, link]);