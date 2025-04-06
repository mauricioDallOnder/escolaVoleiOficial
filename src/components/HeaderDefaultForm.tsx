import { TituloDaPagina, SubtituloDaPagina } from "@/utils/Styles";
import { Box, Avatar, Typography } from "@mui/material";
import Image from "next/image";

export const HeaderForm=({titulo}:{titulo:string})=>{
    return(
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            margin: "0 auto",
          }}
        >
          <Avatar
            sx={{
              width: 100, // tamanho do Avatar
              height: 100, // tamanho do Avatar
              // boxShadow: 'none' // Descomente se necessário
              backgroundColor: "white",
             
            }}
          >
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/chat-dos-otarios.appspot.com/o/logo_volei.png?alt=media&token=f012fe4f-dede-44a2-be37-72ffb07beda5"
              alt=""
              layout="fill" // Isso fará a imagem preencher o Avatar
              objectFit="contain" // Isso garante que a imagem inteira seja visível
            />
          </Avatar>
          <Typography sx={TituloDaPagina}>{titulo}</Typography>
          <Typography sx={SubtituloDaPagina}>Kvôlei</Typography>
        </Box>
    )

}