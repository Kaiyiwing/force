const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1600;
let NodeList = [];
let EdgeList = [];
let canvas,ctx;
let r = 8;
let quad_tree;
let theta = 0.5;
let kr = 1000000;
let ks = 0.0005;
let L = 400;
let f_x = [];
let f_y = [];
let choosed = -1;

window.onload = function()
{

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    click_init();
    ForceDirected();

};


function click_init()
{

    canvas.onmousedown = onClick;
    canvas.onmousemove = onMove;
    canvas.onmouseup = onUp;
}
function onMove(e)
{
    const rect = canvas.getBoundingClientRect();
    const x = parseInt((e.clientX - rect.left) * 2);
    const y = parseInt((e.clientY - rect.top) * 2);

    $('#cord').html(x+','+y);

    if(choosed !== -1)
    {
        NodeList[choosed].x = x;
        NodeList[choosed].y = y;
    }

}
function onClick(e)
{
    const rect = canvas.getBoundingClientRect();
    const x = parseInt((e.clientX - rect.left) * 2);
    const y = parseInt((e.clientY - rect.top) * 2);

    for(let i in NodeList)
    {
        if(Math.sqrt(Math.pow(x - NodeList[i].x,2) + Math.pow(y - NodeList[i].y,2)) < 2*r)
        {
            choosed = i;
        }

    }


}

function onUp(e)
{
    choosed = -1;
}
function ForceDirected(){

    let num = 10;
    // 随机生成一颗树
    for (let i = 0; i < num; i++) {
        NodeList.push(new Node(i));
        f_x[i] = 0;
        f_y[i] = 0;
    }

    for (let i = 0; i < num; i++) {
        let edgeCount = Math.random() * 8 + 1;
        for (let j = 0; j < edgeCount; j++) {
            let targetId = Math.floor(Math.random() * num);
            let edge = new Edge(i, targetId);
            EdgeList.push(edge);
        }
    }


    quad_tree = new QuadTree({
        x: 0,
        y: 0,
        width: 1600,
        height: 1600
    },1);
    //随机生成坐标.
    let initialX, initialY, initialSize = CANVAS_WIDTH * .8;
    for (let i in NodeList) {
        initialX = CANVAS_WIDTH * .5;
        initialY = CANVAS_HEIGHT * .5;
        NodeList[i].x = initialX + initialSize * (Math.random() - .5);
        NodeList[i].y = initialY + initialSize * (Math.random() - .5);

        quad_tree.insert( {
            id: NodeList[i].id,
            x: NodeList[i].x,
            y: NodeList[i].y,
            width: 10,
            height: 10
        });
    }

    self.setInterval("do_time()",16);

    // cal_spring();

    // Draw();
    // cal_repulsive();
    // console.log(quad_tree);
}
function do_time()
{
    cal_repulsive();
    cal_spring();

    apply_force();
    refresh_cord(quad_tree);
    refresh_all_mid(quad_tree);
    Draw();
}
function cal_repulsive()
{
    let c_node;

    for(let i in NodeList)
    {
        c_node = NodeList[i];
        let r_force =  cal_single_force(quad_tree, c_node);
        f_x[i] += r_force[0];
        f_y[i] += r_force[1];
    }

}

function cal_single_force(node, c_node)
{
    let force;
    let force_x=0;
    let force_y=0;
    let dis;
    let x;
    let y;

    x = node.mid_x - c_node.x;
    y = node.mid_y - c_node.y;
    dis = Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
    if(dis/CANVAS_WIDTH < theta)
    {
        force = kr/Math.pow(dis,2);
        force_x = force * ((c_node.x - node.mid_x) / dis);
        force_y = force * ((c_node.y - node.mid_y) / dis);

        return[force_x, force_y];
    }else
    {
        for(let i=0; i<node.nodes.length; i++)
        {
            let r_force =  cal_single_force(node.nodes[i], c_node);
            force_x += r_force[0];
            force_y += r_force[1];
        }
        return[force_x, force_y];
    }
}

function cal_spring()
{
    let f;
    let t;
    let dis;
    let force;
    let x;
    let y;
    let force_x;
    let force_y;
    for(let i in EdgeList)
    {
        f = NodeList[EdgeList[i].source];
        t = NodeList[EdgeList[i].target];
        x = Math.abs(f.x - t.x);
        y = Math.abs(f.y - t.y);
        dis = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

        force = (L - dis) * ks;

        force_x = x !==0 && dis !==0 ? force * (x / dis) : 0;
        force_y = y !==0 && dis !==0 ? force * (y / dis) : 0;

        if(f.x > t.x)
        {
            f_x[f.id] += force_x;
            f_x[t.id] -= force_x;
            // console.log(f_x[f.id]);
        }else
        {
            f_x[f.id] -= force_x;
            f_x[t.id] += force_x;
        }

        if(f.y > t.y)
        {
            f_y[f.id] += force_y;
            f_y[t.id] -= force_y;
        }else
        {
            f_y[f.id] -= force_y;
            f_y[t.id] += force_y;
        }
    }
}

function apply_force()
{
    let c_node;
    for(let i in NodeList)
    {
        c_node = NodeList[i];
        c_node.x += f_x[i];
        c_node.y += f_y[i];

        c_node.x = c_node.x > CANVAS_WIDTH? CANVAS_WIDTH : c_node.x;
        c_node.y = c_node.y > CANVAS_WIDTH? CANVAS_WIDTH : c_node.y;
        c_node.x = c_node.x < 0? 0 : c_node.x;
        c_node.y = c_node.y < 0? 0 : c_node.y;

        f_x[i] = 0;
        f_y[i] = 0;
    }
}
function refresh_all_mid(node)
{
    node.cal_mid();
    if(node.nodes.length !== 0)
    {
        for(let i=0; i<node.nodes.length; i++)
        {
            refresh_all_mid(node.nodes[i]);
        }
    }
}

function refresh_cord(node)
{
    for (let i = 0; i < node.nodes.length; i++) {
        refresh_cord(node.nodes[i]);
    }

    for (let i = 0, len = node.objects.length; i < len; i++) {

        node.objects[i].x = NodeList[node.objects[i].id].x;
        node.objects[i].y = NodeList[node.objects[i].id].y;

    }

}

function Node(id = null) {
    this.id = id;
    this.x = 22;
    this.y = null;
}
function Edge(source = null, target = null) {
    this.source = source;
    this.target = target;
}
function Draw()
{
    ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

    for(let i in NodeList){
        drawCircle(NodeList[i].x, NodeList[i].y);
    }
    for(let i in EdgeList)
    {
        let f = EdgeList[i].source;
        let t = EdgeList[i].target;
        drawLine(NodeList[f].x, NodeList[f].y, NodeList[t].x, NodeList[t].y);
    }
}

function drawCircle(x, y)
{
    ctx.beginPath();
    ctx.arc(x,y,r,0,360,false);
    ctx.fillStyle="red";
    ctx.fill();//画实心圆
    ctx.closePath();
}

function drawLine(x0, y0, x1, y1)
{
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.closePath();
    ctx.stroke();
}
