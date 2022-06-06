; submitted by Anonymous

loop: EQU $60c
ok2: equ ok + ok3 
ok3: equ okl + okr
okl: equ okll + oklr
okr: equ okrl + okrr
okll: equ oklll + okllr
oklr: equ oklrl + oklrr
okrl: equ okrll + okrlr
okrr: equ okrrl + okrrr
oklll: equ $1
okllr: equ $1
oklrl: equ $1
oklrr: equ $1
okrll: equ $1
okrlr: equ $1
okrrl: equ $1
okrrr: equ $1
ok: EQU $618 + nok
nok: equ $0
colors: equ $623
 ldx #0
 ldy #0
 ;init screen
 lda #0
 sta $0
 lda #2
 sta $1
;loop:
 lda colors,x
 bpl ok
 inc $0
 ldx #0
 lda colors,x
;ok:
 inx
 sta ($0),y
 iny
 bne ok2
 inc $1
;ok2:
 jmp loop

;colors:
 dcb 0,2,0,2,2,8,2,8,8,7,8,7,7,1,7,1,1,7,1,7,7,8,7,8,8,2,8,2,2,0,2,0
 dcb 2,2,8,2,8,8,7,8,7,7,1,7,1,1,1,1,1,1,1,1,7,1,7,7,8,7,8,8,2,8,2,2,$ff
