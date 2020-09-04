What can it do

- animate when visible

- execute some js when visible

- animate a number from 1 to n

- animate like skrollable


skrollr logic

run every frame


(function animationUpdate(){
    render();
    animFrame = requestAnimFrame(animationUpdate);
}());


stateMachine = [
    {
        id: aio-1,
        repeat: true,
        element: h1.class
        ratio: 0
        keyframes: [
            100px: font-size: 12px
            200px: font-size: 24px
        ]
    }
]

a: fs
b: color,
c: fs

0: "calc({?}px / {?})"
1: 16
2: 2


//optimize when to call render

// minimum 2 keyframes