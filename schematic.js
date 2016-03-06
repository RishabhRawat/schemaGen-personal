var all_nets = {};
var half_nets = {};
var unplaced_components = [];
var all_components = [];
var component_update_list = [];
var half_nets_update_list = [];
var layer = 0;
var y_index = 1;
var drawing_surface = null;

function create_wire(x1,y1,x2,y2) {
    drawing_surface.path('M '+x1+' '+y1+' h '+(x2-x1)/2+' v '+(y2-y1)+' h '+(x2-x1)/2).addClass('wire');
}
function draw_all_nets(){
    var source,sink;
    var ax,ay,bx,by;
    for( var net_id in all_nets){
        source = all_components[all_nets[net_id].src.source_id];
        ax = source.svg.x()+100;
        ay = source.svg.y() + (50*(1+Object.keys(source.outputports).indexOf(all_nets[net_id].src.source_port))
            /(Object.keys(source.outputports).length+1));
        for(var sink_instance in all_nets[net_id].sink){
            sink = all_components[all_nets[net_id].sink[sink_instance].sink_id];
            bx = sink.svg.x();
            by = sink.svg.y() + (50*(1+Object.keys(sink.inputports).indexOf(all_nets[net_id].sink[sink_instance].sink_port))
                /(Object.keys(sink.inputports).length+1));
            create_wire(ax,ay,bx,by);
        }

    }
}

function drawIO(svg,component_id){
    var input_count, output_count,
        height = 50,
        i;
    input_count = Object.keys(all_components[component_id].inputports).length;
    output_count = Object.keys(all_components[component_id].outputports).length;

    for(i = 1; i<=input_count; i++){
        svg.use('rev_gate_link').x(0).y(i*height/(input_count+1));
    }
    for(i = 1; i<=output_count; i++){
        svg.use('for_gate_link').x(100).y(i*height/(output_count+1));
    }
}

function place_component(component_id){
    var newComponent = drawing_surface.nested()
        .x(100+layer*250).y(y_index*100).addClass('component');
    drawIO(newComponent,component_id);
    switch(all_components[component_id].type){
        case 'PI':
            newComponent.use('input_curve').x(20).y(0);
            break;
        case 'PO':
            newComponent.use('output_curve').x(20).y(0);
            break;
        case '$and':
            newComponent.use('and_curve').x(20).y(0);
            break;
        case '$or':
            newComponent.use('or_curve').x(20).y(0);
            break;
        case '$not':
            newComponent.use('not_curve').x(20).y(0);
            break;
        default:
            newComponent.rect(60,50).x(20);
    }
    all_components[component_id].svg = newComponent;
    y_index++;

}

function add_outputs_to_half_net(element){
    var p = all_components[element].outputports;
    for (var port in p){
        var c_port = p[port].signals;
        for (var signal in c_port) {
            half_nets[c_port[signal]] = true;
        }
    }
}

function wire_check_and_place(component_obj,component_id){
    for(var signal in half_nets){
        for(var singleport in component_obj.inputports)
        {
            if (component_obj.inputports[singleport].signals.indexOf(parseInt(signal)) != -1){
                place_component(component_id);
                half_nets_update_list.push(component_id);
                component_update_list.push(component_id);
                delete unplaced_components[component_id];
                return;
            }
        }
    }
    return;
}

function draw_all_components(){
    while (Object.getOwnPropertyNames(unplaced_components).length > 1) {
        unplaced_components.forEach(wire_check_and_place);
        //Can be changed to half_nets={}
        half_nets_update_list.forEach(function(element,index){
           delete half_nets[index];
        });
        component_update_list.forEach(add_outputs_to_half_net);

        layer++;
        y_index = 1;
    }
}

function create_schema(data) {
    var m = Object.keys(data.modules);
    var module = data.modules[m];
    var port_list = module.ports;

    //NET PARSING
    var net_list = module.netnames;
    for (var net_i in net_list) {
        for (var bit in net_list[net_i].bits) {
            all_nets[net_list[net_i].bits[bit]] = {name: net_i, src: {}, sink: []};
        }
    }
    //PORT PARSING
    for (var port_i in port_list) {
        if (port_list[port_i].direction == 'input') {
            var c = {name: port_i, type: 'PI', inputports: {}, outputports: {}};
            c.outputports[port_i] = {signals: port_list[port_i].bits};
            all_components.push(c);
            for (var bit_i in port_list[port_i].bits) {
                all_nets[port_list[port_i].bits[bit_i]].src.source_id = all_components.indexOf(c);
                all_nets[port_list[port_i].bits[bit_i]].src.source_port = port_i;
            }
        }
        else if (port_list[port_i].direction == 'output') {
            var c = {name: port_i, type: 'PO', inputports: {}, outputports: {}};
            c.inputports[port_i] = {signals: port_list[port_i].bits};
            all_components.push(c);
            for (var bit_i in port_list[port_i].bits) {
                all_nets[port_list[port_i].bits[bit_i]].sink.push({sink_id:all_components.length-1,sink_port:port_i});
            }
        }
        else
            alert('invalid port direction: ' + port_list[port_i].direction);
    }

    //COMPONENT PARSING
    var cell_list = module.cells;
    for (var cell_i in cell_list) {
        var c;
        c = {name: cell_i, type: cell_list[cell_i].type, inputports: {}, outputports: {}};
        c = all_components[all_components.push(c)-1];
        for (var port_i in cell_list[cell_i].connections) {
            if (cell_list[cell_i].port_directions[port_i] == 'input') {
                c.inputports[port_i] = {signals: cell_list[cell_i].connections[port_i]};
                for (var bit_i in cell_list[cell_i].connections[port_i]) {
                    var signal_list = cell_list[cell_i].connections[port_i];
                    for (var s in signal_list) {
                        if(signal_list[s] != "1" && signal_list[s] != "0") {
                            all_nets[signal_list[s]].sink.push({sink_id:all_components.length-1,sink_port:port_i});
                        }
                    }
                }
            }
            else if (cell_list[cell_i].port_directions[port_i] == 'output') {
                c.outputports[port_i] = {signals: cell_list[cell_i].connections[port_i]};
                for (var bit_i in cell_list[cell_i].connections[port_i]) {
                    var signal_list = cell_list[cell_i].connections[port_i];
                    for (var s in signal_list){
                            all_nets[signal_list[s]].src.source_id = all_components.indexOf(c);
                            all_nets[signal_list[s]].src.source_port = port_i;
                        }
                }
            }
            else
                alert('WRONG NET DIRECTION' + cell_i);
        }

    }


    unplaced_components = JSON.parse(JSON.stringify(all_components));
    for (var elements in all_components) {
        if(all_components[elements].type =='PI'){
            place_component(elements)
            add_outputs_to_half_net(elements);
            delete unplaced_components[elements];
        }
    }
    layer++;
    y_index=1;
    
    draw_all_components();
    draw_all_nets();

    console.log('hello');
}


$(function () {
    var draw = SVG('schematic_container');
    var test = {
        "creator": "Yosys 0.5+339 (git sha1 34f34be, clang 3.4-1ubuntu3 -fPIC -Os)",
        "modules": {
            "up3down5": {
                "ports": {
                    "clock": {
                        "direction": "input",
                        "bits": [ 2 ]
                    },
                    "data_in": {
                        "direction": "input",
                        "bits": [ 3, 4, 5, 6, 7, 8, 9, 10, 11 ]
                    },
                    "up": {
                        "direction": "input",
                        "bits": [ 12 ]
                    },
                    "down": {
                        "direction": "input",
                        "bits": [ 13 ]
                    },
                    "carry_out": {
                        "direction": "output",
                        "bits": [ 14 ]
                    },
                    "borrow_out": {
                        "direction": "output",
                        "bits": [ 15 ]
                    },
                    "count_out": {
                        "direction": "output",
                        "bits": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ]
                    },
                    "parity_out": {
                        "direction": "output",
                        "bits": [ 25 ]
                    }
                },
                "cells": {
                    "$add$tests/simple/fiedler-cooley.v:17$3": {
                        "hide_name": 1,
                        "type": "$add",
                        "parameters": {
                            "A_SIGNED": 0,
                            "A_WIDTH": 9,
                            "B_SIGNED": 0,
                            "B_WIDTH": 2,
                            "Y_WIDTH": 10
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:17"
                        },
                        "port_directions": {
                            "A": "input",
                            "B": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
                            "B": [ "1", "1" ],
                            "Y": [ 26, 27, 28, 29, 30, 31, 32, 33, 34, 35 ]
                        }
                    },
                    "$and$tests/simple/fiedler-cooley.v:28$5": {
                        "hide_name": 1,
                        "type": "$and",
                        "parameters": {
                            "A_SIGNED": 0,
                            "A_WIDTH": 1,
                            "B_SIGNED": 0,
                            "B_WIDTH": 1,
                            "Y_WIDTH": 1
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:28"
                        },
                        "port_directions": {
                            "A": "input",
                            "B": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 12 ],
                            "B": [ 35 ],
                            "Y": [ 36 ]
                        }
                    },
                    "$and$tests/simple/fiedler-cooley.v:29$6": {
                        "hide_name": 1,
                        "type": "$and",
                        "parameters": {
                            "A_SIGNED": 0,
                            "A_WIDTH": 1,
                            "B_SIGNED": 0,
                            "B_WIDTH": 1,
                            "Y_WIDTH": 1
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:29"
                        },
                        "port_directions": {
                            "A": "input",
                            "B": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 13 ],
                            "B": [ 37 ],
                            "Y": [ 38 ]
                        }
                    },
                    "$procdff$41": {
                        "hide_name": 1,
                        "type": "$dff",
                        "parameters": {
                            "CLK_POLARITY": 1,
                            "WIDTH": 1
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        },
                        "port_directions": {
                            "CLK": "input",
                            "D": "input",
                            "Q": "output"
                        },
                        "connections": {
                            "CLK": [ 2 ],
                            "D": [ 36 ],
                            "Q": [ 14 ]
                        }
                    },
                    "$procdff$42": {
                        "hide_name": 1,
                        "type": "$dff",
                        "parameters": {
                            "CLK_POLARITY": 1,
                            "WIDTH": 1
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        },
                        "port_directions": {
                            "CLK": "input",
                            "D": "input",
                            "Q": "output"
                        },
                        "connections": {
                            "CLK": [ 2 ],
                            "D": [ 38 ],
                            "Q": [ 15 ]
                        }
                    },
                    "$procdff$43": {
                        "hide_name": 1,
                        "type": "$dff",
                        "parameters": {
                            "CLK_POLARITY": 1,
                            "WIDTH": 1
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        },
                        "port_directions": {
                            "CLK": "input",
                            "D": "input",
                            "Q": "output"
                        },
                        "connections": {
                            "CLK": [ 2 ],
                            "D": [ 39 ],
                            "Q": [ 25 ]
                        }
                    },
                    "$procdff$46": {
                        "hide_name": 1,
                        "type": "$dff",
                        "parameters": {
                            "CLK_POLARITY": 1,
                            "WIDTH": 9
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        },
                        "port_directions": {
                            "CLK": "input",
                            "D": "input",
                            "Q": "output"
                        },
                        "connections": {
                            "CLK": [ 2 ],
                            "D": [ 40, 41, 42, 43, 44, 45, 46, 47, 48 ],
                            "Q": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ]
                        }
                    },
                    "$procmux$36": {
                        "hide_name": 1,
                        "type": "$pmux",
                        "parameters": {
                            "S_WIDTH": 3,
                            "WIDTH": 9
                        },
                        "attributes": {
                        },
                        "port_directions": {
                            "A": "input",
                            "B": "input",
                            "S": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
                            "B": [ 26, 27, 28, 29, 30, 31, 32, 33, 34, 49, 50, 51, 52, 53, 54, 55, 56, 57, 3, 4, 5, 6, 7, 8, 9, 10, 11 ],
                            "S": [ 58, 59, 60 ],
                            "Y": [ 40, 41, 42, 43, 44, 45, 46, 47, 48 ]
                        }
                    },
                    "$procmux$37_CMP0": {
                        "hide_name": 1,
                        "type": "$eq",
                        "parameters": {
                            "A_SIGNED": 0,
                            "A_WIDTH": 2,
                            "B_SIGNED": 0,
                            "B_WIDTH": 2,
                            "Y_WIDTH": 1
                        },
                        "attributes": {
                        },
                        "port_directions": {
                            "A": "input",
                            "B": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 13, 12 ],
                            "B": [ "0", "1" ],
                            "Y": [ 58 ]
                        }
                    },
                    "$procmux$38_CMP0": {
                        "hide_name": 1,
                        "type": "$eq",
                        "parameters": {
                            "A_SIGNED": 0,
                            "A_WIDTH": 2,
                            "B_SIGNED": 0,
                            "B_WIDTH": 1,
                            "Y_WIDTH": 1
                        },
                        "attributes": {
                        },
                        "port_directions": {
                            "A": "input",
                            "B": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 13, 12 ],
                            "B": [ "1" ],
                            "Y": [ 59 ]
                        }
                    },
                    "$procmux$39_CMP0": {
                        "hide_name": 1,
                        "type": "$logic_not",
                        "parameters": {
                            "A_SIGNED": 0,
                            "A_WIDTH": 2,
                            "Y_WIDTH": 1
                        },
                        "attributes": {
                        },
                        "port_directions": {
                            "A": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 13, 12 ],
                            "Y": [ 60 ]
                        }
                    },
                    "$reduce_xor$tests/simple/fiedler-cooley.v:27$4": {
                        "hide_name": 1,
                        "type": "$reduce_xor",
                        "parameters": {
                            "A_SIGNED": 0,
                            "A_WIDTH": 9,
                            "Y_WIDTH": 1
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:27"
                        },
                        "port_directions": {
                            "A": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 40, 41, 42, 43, 44, 45, 46, 47, 48 ],
                            "Y": [ 39 ]
                        }
                    },
                    "$sub$tests/simple/fiedler-cooley.v:16$2": {
                        "hide_name": 1,
                        "type": "$sub",
                        "parameters": {
                            "A_SIGNED": 0,
                            "A_WIDTH": 9,
                            "B_SIGNED": 0,
                            "B_WIDTH": 3,
                            "Y_WIDTH": 10
                        },
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:16"
                        },
                        "port_directions": {
                            "A": "input",
                            "B": "input",
                            "Y": "output"
                        },
                        "connections": {
                            "A": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
                            "B": [ "1", "0", "1" ],
                            "Y": [ 49, 50, 51, 52, 53, 54, 55, 56, 57, 37 ]
                        }
                    }
                },
                "netnames": {
                    "$0\\borrow_out[0:0]": {
                        "hide_name": 1,
                        "bits": [ 38 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        }
                    },
                    "$0\\carry_out[0:0]": {
                        "hide_name": 1,
                        "bits": [ 36 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        }
                    },
                    "$0\\cnt_dn[9:0]": {
                        "hide_name": 1,
                        "bits": [ 49, 50, 51, 52, 53, 54, 55, 56, 57, 37 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        }
                    },
                    "$0\\cnt_up[9:0]": {
                        "hide_name": 1,
                        "bits": [ 26, 27, 28, 29, 30, 31, 32, 33, 34, 35 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        }
                    },
                    "$0\\count_out[8:0]": {
                        "hide_name": 1,
                        "bits": [ 40, 41, 42, 43, 44, 45, 46, 47, 48 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        }
                    },
                    "$0\\parity_out[0:0]": {
                        "hide_name": 1,
                        "bits": [ 39 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:14"
                        }
                    },
                    "$procmux$37_CMP": {
                        "hide_name": 1,
                        "bits": [ 58 ],
                        "attributes": {
                        }
                    },
                    "$procmux$38_CMP": {
                        "hide_name": 1,
                        "bits": [ 59 ],
                        "attributes": {
                        }
                    },
                    "$procmux$39_CMP": {
                        "hide_name": 1,
                        "bits": [ 60 ],
                        "attributes": {
                        }
                    },
                    "borrow_out": {
                        "hide_name": 0,
                        "bits": [ 15 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:9"
                        }
                    },
                    "carry_out": {
                        "hide_name": 0,
                        "bits": [ 14 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:9"
                        }
                    },
                    "clock": {
                        "hide_name": 0,
                        "bits": [ 2 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:6"
                        }
                    },
                    "count_nxt": {
                        "hide_name": 0,
                        "bits": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:12"
                        }
                    },
                    "count_out": {
                        "hide_name": 0,
                        "bits": [ 16, 17, 18, 19, 20, 21, 22, 23, 24 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:8"
                        }
                    },
                    "data_in": {
                        "hide_name": 0,
                        "bits": [ 3, 4, 5, 6, 7, 8, 9, 10, 11 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:5"
                        }
                    },
                    "down": {
                        "hide_name": 0,
                        "bits": [ 13 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:6"
                        }
                    },
                    "parity_out": {
                        "hide_name": 0,
                        "bits": [ 25 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:9"
                        }
                    },
                    "up": {
                        "hide_name": 0,
                        "bits": [ 12 ],
                        "attributes": {
                            "src": "tests/simple/fiedler-cooley.v:6"
                        }
                    }
                }
            }
        }
    };
    drawing_surface = draw;
    create_schema(test);
});




