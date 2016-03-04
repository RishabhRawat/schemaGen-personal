var s = Snap('#schema_surface');
s.width = document.getElementById('schematic_container').offsetWidth;
s.height = document.getElementById('schematic_container').offsetHeight;
s.attr({color:'#00FF00'});

var hr = s.line(s.width*0.9,0, s.width*0.9, s.height);
hr.attr({stroke:'#000000'});
Snap.load("gates.svg", function (f) {
    g = f.select("#andgate");
    s.append(g);
    // Making croc draggable. Go ahead drag it around!
    g.drag();
    g.click(function(){
        alert("correct");
    });
    // Obviously drag could take event handlers too
    // That’s better! selectAll for the rescue.
});
var c = s.getBBox();


