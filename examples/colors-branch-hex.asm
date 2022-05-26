; submitted by Anonymous

 ldx #0
 ldy #0
 ;init screen
 lda #0
 sta $0
 lda #2
 sta $1
loop:
 lda colors,x
 bpl $0d ;branch to ok
 inc $0
 ldx #0
 lda colors,x
 jmp ok
ok2:
 jmp loop
ok:
 inx
 sta ($0),y
 iny
 bne $f7 ;branch to ok2
 inc $1
 jmp ok2

colors:
 dcb 0,2,0,2,2,8,2,8,8,7,8,7,7,1,7,1,1,7,1,7,7,8,7,8,8,2,8,2,2,0,2,0
 dcb 2,2,8,2,8,8,7,8,7,7,1,7,1,1,1,1,1,1,1,1,7,1,7,7,8,7,8,8,2,8,2,2,$ff

