; This is just a simple example
; to show how you can implement
; "splash screens" to your programs
;
; Notice that you don't have to
; press the "Run" button to see
; the results.
;
; This makes a nice "cover art" to
; your program.
;
; (Any takers on the Last Ninja game? ;))

start:
    rts ; just exit nicely

*=$2e0
    dcb 0,0,0,0,9,9,15,15,8,2,8,9,0,0,0,0
    dcb 0,0,0,9,9,8,2,8,15,9,9,9,0,0,0,0
    dcb 0,0,0,0,0,0,0,0,9,8,15,15,8,15,8,9
    dcb 9,15,15,15,8,8,9,0,0,0,0,0,0,0,0,0
    dcb 0,0,0,0,9,9,0,0,0,0,0,9,8,15,8,15
    dcb 8,15,8,9,0,0,0,0,0,0,0,0,0,0,0,0
    dcb 0,0,8,15,15,15,15,15,9,0,0,0,0,9,8,15
    dcb 8,9,0,0,0,0,9,8,15,15,15,15,8,8,0,0
    dcb 0,8,9,9,0,0,9,15,15,8,2,0,0,0,8,15
    dcb 8,0,0,0,9,8,15,15,15,9,0,9,9,8,8,0
    dcb 9,0,0,15,9,9,0,9,0,0,0,9,0,0,8,8
    dcb 8,2,0,9,0,9,0,9,9,0,8,15,15,0,2,9
    dcb 8,8,9,15,15,8,0,9,8,15,15,0,9,0,8,15
    dcb 15,8,0,9,15,15,9,8,0,9,8,15,15,8,8,8
    dcb 15,8,15,15,15,15,15,15,15,15,15,15,9,2,15,15
    dcb 15,8,9,9,15,15,15,15,15,15,15,15,15,15,15,8
    dcb 8,8,8,15,15,15,8,8,8,2,9,9,9,9,9,15
    dcb 9,9,9,9,0,2,8,8,8,15,15,15,15,15,8,2
    dcb 0,0,9,9,9,9,9,9,9,0,15,0,0,9,0,0
    dcb 0,0,9,0,0,9,0,0,9,9,15,9,9,0,0,0
    dcb 0,0,0,15,9,0,0,15,0,0,15,0,0,0,15,9
    dcb 0,0,15,0,0,15,0,0,0,0,9,0,9,0,0,0
    dcb 0,0,0,15,0,15,9,10,0,0,15,9,0,0,15,0
    dcb 15,9,10,0,0,15,9,0,0,9,15,0,15,9,0,0
    dcb 0,0,0,15,9,0,15,10,2,0,10,2,0,0,15,9
    dcb 0,15,10,2,0,15,15,0,0,15,2,0,0,15,2,0
    dcb 0,0,0,10,2,0,2,10,2,0,10,10,0,0,10,2
    dcb 0,2,10,2,0,2,10,0,0,10,2,9,2,2,10,2
    dcb 0,0,0,10,10,0,0,10,10,0,10,10,10,2,10,10
    dcb 0,0,10,10,0,10,10,2,10,10,0,0,0,2,10,2
    dcb 0,0,2,10,10,0,0,2,2,0,0,2,0,10,10,2
    dcb 0,0,2,0,2,10,10,2,2,2,0,0,0,2,10,10
    dcb 0,0,2,10,2,0,0,0,0,0,0,0,0,10,10,2
    dcb 0,0,0,0,10,10,10,0,0,0,0,0,0,2,10,2

